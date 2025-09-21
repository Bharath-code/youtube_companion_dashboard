import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { z } from 'zod';

// Validation schema for updating notes
const updateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').optional(),
  tags: z.array(z.string()).optional(),
  videoId: z.string().min(1, 'Video ID is required').optional(),
});

// GET /api/notes/[noteId] - Get a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      await eventLogger.logAuthFailure('Authentication required in GET /api/notes/[noteId]', clientIP, userAgent);
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

    const { noteId } = await params;

    if (!noteId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note ID is required',
      }, { status: 400 });
    }

    // Fetch the note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id, // Ensure user can only access their own notes
      },
    });

    if (!note) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note not found',
      }, { status: 404 });
    }

    // Parse tags from JSON string
    const noteWithParsedTags = {
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : [],
    };

    return NextResponse.json<APIResponse<typeof noteWithParsedTags>>({
      success: true,
      data: noteWithParsedTags,
    });

  } catch (error) {
    console.error('Note GET API error:', error);

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PUT /api/notes/[noteId] - Update a specific note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      await eventLogger.logAuthFailure('Authentication required in PUT /api/notes/[noteId]', clientIP, userAgent);
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

    const { noteId } = await params;

    if (!noteId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note ID is required',
      }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note not found',
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content;
    }
    
    if (validatedData.videoId !== undefined) {
      updateData.videoId = validatedData.videoId;
    }
    
    if (validatedData.tags !== undefined) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
    });

    // Parse tags back to array for response
    const noteWithParsedTags = {
      ...updatedNote,
      tags: updatedNote.tags ? JSON.parse(updatedNote.tags) : [],
    };

    // Log note update event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    
    await eventLogger.logNoteUpdated(
      user.id,
      noteId,
      validatedData,
      clientIP,
      userAgent
    );

    return NextResponse.json<APIResponse<typeof noteWithParsedTags>>({
      success: true,
      data: noteWithParsedTags,
      message: 'Note updated successfully',
    });

  } catch (error) {
    console.error('Note PUT API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Invalid input data',
        message: error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE /api/notes/[noteId] - Delete a specific note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      await eventLogger.logAuthFailure('Authentication required in DELETE /api/notes/[noteId]', clientIP, userAgent);
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

    const { noteId } = await params;

    if (!noteId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note ID is required',
      }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Note not found',
      }, { status: 404 });
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: noteId },
    });

    // Log note deletion event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    
    await eventLogger.logNoteDeleted(
      user.id,
      noteId,
      clientIP,
      userAgent
    );

    return NextResponse.json<APIResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
      message: 'Note deleted successfully',
    });

  } catch (error) {
    console.error('Note DELETE API error:', error);

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}