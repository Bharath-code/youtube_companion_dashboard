import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Fetch all notes for the user to extract tags
    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      select: { tags: true },
    });

    // Extract and deduplicate tags
    const allTags = new Set<string>();
    
    notes.forEach(note => {
      if (note.tags) {
        try {
          const tags = JSON.parse(note.tags) as string[];
          tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        } catch (error) {
          console.error('Error parsing tags for note:', error);
        }
      }
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