import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { notesRateLimiter } from '@/lib/utils/rate-limit';
import { z } from 'zod';

// Enhanced search schema with more options
const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  videoId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: z.enum(['createdAt', 'updatedAt', 'content', 'relevance']).optional().default('relevance'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  includeHighlights: z.coerce.boolean().optional().default(false),
});

// GET /api/notes/search - Enhanced search with better performance and features
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

    // Check rate limit
    const clientId = notesRateLimiter.getClientIdentifier(request, user.id);
    const rateLimitResult = notesRateLimiter.checkRateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Handle tags parameter (can be comma-separated string)
    if (queryParams.tags && typeof queryParams.tags === 'string') {
      (queryParams as Record<string, unknown>).tags = queryParams.tags.split(',').filter(Boolean);
    }

    const validatedParams = searchSchema.parse(queryParams);
    const { query, tags, videoId, page, limit, orderBy, orderDirection, includeHighlights } = validatedParams;

    // Build enhanced where clause for search
    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (videoId) {
      where.videoId = videoId;
    }

    // Enhanced text search with multiple strategies
    if (query && query.trim()) {
      const searchTerm = query.trim();
      
      // For SQLite, LIKE is case-insensitive by default
      // In production with PostgreSQL, this could use full-text search
      where.OR = [
        {
          content: {
            contains: searchTerm,
          },
        },
        // Also search in tags (JSON string contains)
        {
          tags: {
            contains: searchTerm,
          },
        },
      ];
    }

    // Enhanced tag filtering with exact and partial matches
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => ({
        tags: {
          contains: `"${tag}"`, // Exact tag match in JSON
        },
      }));

      if (where.OR) {
        // Combine with existing OR conditions
        where.AND = [
          { OR: where.OR },
          { OR: tagConditions },
        ];
        delete where.OR;
      } else {
        where.OR = tagConditions;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Determine ordering
    let orderByClause: Record<string, string> = {};
    if (orderBy === 'relevance' && query) {
      // For relevance, we'll order by updated date as a proxy
      // In a real implementation, you'd use a proper search engine
      orderByClause = { updatedAt: 'desc' };
    } else if (orderBy !== 'relevance') {
      orderByClause = { [orderBy]: orderDirection };
    } else {
      orderByClause = { createdAt: orderDirection };
    }

    // Fetch notes with enhanced search
    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    // Parse tags and add highlights if requested
    const processedNotes = notes.map((note) => {
      const parsedNote = {
        ...note,
        tags: note.tags ? JSON.parse(note.tags as string) : [],
      };

      // Add search highlights if requested and query exists
      if (includeHighlights && query && query.trim()) {
        const searchTerm = query.trim();
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        
        // Add highlighted content (simple implementation)
        (parsedNote as Record<string, unknown>).highlightedContent = parsedNote.content.replace(
          regex,
          '<mark>$1</mark>'
        );
      }

      return parsedNote;
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Log enhanced search event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    
    await eventLogger.logSearchPerformed(
      user.id,
      { 
        query, 
        tags, 
        videoId, 
        page, 
        limit, 
        orderBy, 
        includeHighlights,
        resultsCount: notes.length,
        totalResults: totalCount,
      },
      clientIP,
      userAgent
    );

    return NextResponse.json<APIResponse<{
      notes: typeof processedNotes;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      searchMeta: {
        query?: string;
        tags?: string[];
        videoId?: string;
        orderBy: string;
        includeHighlights: boolean;
        searchTime: number;
      };
    }>>({
      success: true,
      data: {
        notes: processedNotes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        searchMeta: {
          query,
          tags,
          videoId,
          orderBy,
          includeHighlights,
          searchTime: Date.now(), // Simple timestamp for now
        },
      },
    });

  } catch (error) {
    console.error('Enhanced search API error:', error);

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