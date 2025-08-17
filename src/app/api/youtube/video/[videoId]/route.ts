import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthenticatedYouTubeService } from '@/lib/services/youtube-auth';
import { YouTubeAPIError } from '@/lib/services/youtube';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your Google account.' },
        { status: 401 }
      );
    }

    const { videoId } = await params;
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Create authenticated YouTube service
    const service = createAuthenticatedYouTubeService(session.accessToken);
    
    // Get video details with ownership validation
    const result = await service.getVideoDetailsWithOwnership(videoId);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    
    if (error instanceof YouTubeAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch video details' },
      { status: 500 }
    );
  }
}