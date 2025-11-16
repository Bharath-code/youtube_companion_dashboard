import { NextRequest, NextResponse } from 'next/server';
import { youtubeService, YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse, VideoDetails } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { EventType, EntityType } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Video ID or URL is required',
      }, { status: 400 });
    }

    const videoDetails = await youtubeService.getInstance().getVideoDetails(videoId);

    // Log video viewed (public)
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    await eventLogger.logEvent({
      eventType: EventType.VIDEO_VIEWED,
      entityType: EntityType.VIDEO,
      entityId: videoId,
      metadata: {},
      ipAddress: clientIP,
      userAgent,
      userId: 'system',
    });

    return NextResponse.json<APIResponse<VideoDetails>>({
      success: true,
      data: videoDetails,
    });

  } catch (error) {
    console.error('YouTube API error:', error);

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