import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { youtubeService, YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { EventType, EntityType } from '@/lib/types/database';
import { youtubeActionsRateLimiter } from '@/lib/utils/rate-limit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Comment ID is required',
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
    const result = await service.deleteComment(commentId, session.accessToken);

    // Log event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    await eventLogger.logEvent({
      eventType: EventType.COMMENT_DELETED,
      entityType: EntityType.COMMENT,
      entityId: commentId,
      metadata: {},
      ipAddress: clientIP,
      userAgent,
      userId: session.user?.id || 'system',
    });

    return NextResponse.json<APIResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: result },
    });

  } catch (error) {
    console.error('YouTube Comment Delete API error:', error);

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