import { NextRequest, NextResponse } from 'next/server';
import { youtubeService, YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse, VideoDetails } from '@/lib/types';

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