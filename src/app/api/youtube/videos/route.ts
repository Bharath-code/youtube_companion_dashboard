import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthenticatedYouTubeService } from '@/lib/services/youtube-auth';
import { YouTubeAPIError } from '@/lib/services/youtube';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your Google account.' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;

    // Validate maxResults
    if (maxResults < 1 || maxResults > 50) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Create authenticated YouTube service
    const service = createAuthenticatedYouTubeService(session.accessToken);
    
    // Get user's videos
    const result = await service.getUserVideos(maxResults, pageToken);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching user videos:', error);
    
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
      { error: 'Failed to fetch user videos' },
      { status: 500 }
    );
  }
}