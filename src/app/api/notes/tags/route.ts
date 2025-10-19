import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { getDatabaseConfig } from '@/lib/db-config';

const isPostgres = () => getDatabaseConfig().provider === 'postgresql';

// GET /api/notes/tags - Get all unique tags for the authenticated user
export async function GET() {
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

    // Fetch all notes for the user to extract tags
    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      select: { tags: true },
    });

    // Extract and deduplicate tags
    const allTags = new Set<string>();
    
    notes.forEach(note => {
      const raw = (note as unknown as { tags: unknown }).tags;
      const tags = raw === null || raw === undefined
        ? []
        : Array.isArray(raw)
          ? (raw as string[])
          : (() => { try { return JSON.parse(raw as string) as string[] } catch { return [] as string[] } })();

      tags.forEach(tag => {
        if (tag && tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    });

    // Convert to sorted array
    const sortedTags = Array.from(allTags).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    return NextResponse.json<APIResponse<string[]>>({
      success: true,
      data: sortedTags,
    });

  } catch (error) {
    console.error('Tags GET API error:', error);

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}