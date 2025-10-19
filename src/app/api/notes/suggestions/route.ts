import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';
import { getDatabaseConfig } from '@/lib/db-config';

const isPostgres = () => getDatabaseConfig().provider === 'postgresql';

// Search suggestions schema
const suggestionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
  type: z.enum(['content', 'tags', 'both']).optional().default('both'),
});

interface SearchSuggestion {
  text: string;
  type: 'content' | 'tag';
  frequency: number;
  context?: string; // Preview of content where the suggestion appears
}

// GET /api/notes/suggestions - Get search suggestions based on user's notes
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // Create user if they don't exist (since we're using JWT strategy)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = suggestionsSchema.parse(queryParams);
    const { query, limit, type } = validatedParams;

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Get user's notes for generating suggestions
    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      select: { content: true, tags: true },
    });

    // Generate content-based suggestions
    if (type === 'content' || type === 'both') {
      const contentWords = new Map<string, { count: number; contexts: string[] }>();
      
      notes.forEach(note => {
        // Extract words from content (simple tokenization)
        const words = note.content
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => 
            word.length > 2 && 
            word.includes(queryLower) &&
            word !== queryLower
          );

        words.forEach(word => {
          if (!contentWords.has(word)) {
            contentWords.set(word, { count: 0, contexts: [] });
          }
          const entry = contentWords.get(word)!;
          entry.count++;
          
          // Add context (surrounding text)
          const wordIndex = note.content.toLowerCase().indexOf(word);
          if (wordIndex !== -1 && entry.contexts.length < 3) {
            const start = Math.max(0, wordIndex - 30);
            const end = Math.min(note.content.length, wordIndex + word.length + 30);
            const context = note.content.substring(start, end).trim();
            entry.contexts.push(context);
          }
        });
      });

      // Convert to suggestions and sort by frequency
      contentWords.forEach((data, word) => {
        suggestions.push({
          text: word,
          type: 'content',
          frequency: data.count,
          context: data.contexts[0], // Use first context as preview
        });
      });
    }

    // Generate tag-based suggestions
    if (type === 'tags' || type === 'both') {
      const tagFrequency = new Map<string, number>();
      
      notes.forEach(note => {
        const raw = (note as unknown as { tags: unknown }).tags;
        const tags = raw === null || raw === undefined
          ? []
          : Array.isArray(raw)
            ? (raw as string[])
            : (() => { try { return JSON.parse(raw as string) as string[] } catch { return [] as string[] } })();

        tags.forEach(tag => {
          const tagLower = tag.toLowerCase();
          if (tagLower.includes(queryLower) && tagLower !== queryLower) {
            tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
          }
        });
      });

      // Convert to suggestions
      tagFrequency.forEach((frequency, tag) => {
        suggestions.push({
          text: tag,
          type: 'tag',
          frequency,
        });
      });
    }

    // Sort by frequency (descending) and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);

    return NextResponse.json<APIResponse<SearchSuggestion[]>>({
      success: true,
      data: sortedSuggestions,
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Invalid query parameters',
        message: error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}