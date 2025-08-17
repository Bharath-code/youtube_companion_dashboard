import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthenticatedYouTubeService, YouTubeAPIError } from '@/lib/services/youtube-auth';
import { APIResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const service = createAuthenticatedYouTubeService(session.accessToken);
    const channelInfo = await service.getUserChannel();

    return NextResponse.json<APIResponse<typeof channelInfo>>({
      success: true,
      data: channelInfo,
    });

  } catch (error) {
    console.error('YouTube Channel API error:', error);

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