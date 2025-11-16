import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthenticatedYouTubeService } from '@/lib/services/youtube-auth';
import { YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { EventType, EntityType } from '@/lib/types/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required. Please sign in with your Google account.',
      }, { status: 401 });
    }

    const { videoId } = await params;
    
    if (!videoId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Video ID is required',
      }, { status: 400 });
    }

    // Parse request body
    let updates;
    try {
      updates = await request.json();
    } catch {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Invalid JSON in request body',
      }, { status: 400 });
    }

    // Validate updates
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Updates object is required',
      }, { status: 400 });
    }

    const { title, description } = updates;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Title must be a string',
        }, { status: 400 });
      }
      
      if (!title.trim()) {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Title cannot be empty',
        }, { status: 400 });
      }
      
      if (title.length > 100) {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Title must be 100 characters or less',
        }, { status: 400 });
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Description must be a string',
        }, { status: 400 });
      }
      
      if (description.length > 5000) {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Description must be 5000 characters or less',
        }, { status: 400 });
      }
    }

    // Check if there are any valid updates
    if (title === undefined && description === undefined) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'At least one field (title or description) must be provided',
      }, { status: 400 });
    }

    // Create authenticated YouTube service
    const service = createAuthenticatedYouTubeService(session.accessToken);
    
    // Update video metadata
    const updatedVideo = await service.updateVideoMetadata(videoId, {
      title: title?.trim(),
      description,
    });
    
    // Log update
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    await eventLogger.logEvent({
      eventType: EventType.VIDEO_UPDATED,
      entityType: EntityType.VIDEO,
      entityId: videoId,
      metadata: { titleUpdated: title !== undefined, descriptionUpdated: description !== undefined },
      ipAddress: clientIP,
      userAgent,
      userId: session.user?.id || 'system',
    });

    return NextResponse.json<APIResponse<typeof updatedVideo>>({
      success: true,
      data: updatedVideo,
      message: 'Video metadata updated successfully'
    });

  } catch (error) {
    console.error('Error updating video metadata:', error);
    
    if (error instanceof YouTubeAPIError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: error.message,
      }, { status: error.status || 500 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Failed to update video metadata',
    }, { status: 500 });
  }
}