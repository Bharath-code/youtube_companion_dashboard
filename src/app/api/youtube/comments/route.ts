import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { youtubeService, YouTubeAPIError, YouTubeCommentsDisabledError } from '@/lib/services/youtube';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { EventType, EntityType } from '@/lib/types/database';
import { youtubeActionsRateLimiter } from '@/lib/utils/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const pageToken = searchParams.get('pageToken') || undefined;

    if (!videoId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Video ID or URL is required',
      }, { status: 400 });
    }

    const result = await youtubeService.getInstance().getComments(videoId, maxResults, pageToken);

    return NextResponse.json<APIResponse<typeof result>>({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('YouTube Comments API error:', error);

    if (error instanceof YouTubeCommentsDisabledError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Comments are disabled for this video',
      }, { status: 200 }); // Return 200 since this is expected behavior
    }

    if (error instanceof YouTubeAPIError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: error.message,
      }, { status: error.status || 500 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, text, parentCommentId } = body;

    if (!videoId || !text) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Video ID and comment text are required',
      }, { status: 400 });
    }

    if (text.trim().length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Comment text cannot be empty',
      }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Comment text is too long (maximum 10,000 characters)',
      }, { status: 400 });
    }

    // Rate limit by user/IP
    const clientId = youtubeActionsRateLimiter.getClientIdentifier(request, session.user?.id);
    const rate = youtubeActionsRateLimiter.checkRateLimit(clientId);
    if (!rate.allowed) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many actions. Please try again later.',
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rate.resetTime.toString(),
        },
      });
    }

    const service = youtubeService.getInstance();
    let result;

    if (parentCommentId) {
      // This is a reply to an existing comment
      result = await service.replyToComment(parentCommentId, text.trim(), session.accessToken);
    } else {
      // This is a new top-level comment
      result = await service.postComment(videoId, text.trim(), session.accessToken);
    }

    // Log event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    await eventLogger.logEvent({
      eventType: EventType.COMMENT_ADDED,
      entityType: EntityType.COMMENT,
      entityId: result.id,
      metadata: { videoId, parentCommentId: parentCommentId ?? undefined },
      ipAddress: clientIP,
      userAgent,
      userId: session.user?.id || 'system',
    });

    return NextResponse.json<APIResponse<typeof result>>({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('YouTube Comment Post API error:', error);

    if (error instanceof YouTubeAPIError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: error.message,
      }, { status: error.status || 500 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}