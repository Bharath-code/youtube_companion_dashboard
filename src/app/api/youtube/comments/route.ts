import { NextRequest, NextResponse } from 'next/server';
import { youtubeService, YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse } from '@/lib/types';

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