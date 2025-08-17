import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { youtubeService, YouTubeAPIError } from '@/lib/services/youtube';
import { APIResponse } from '@/lib/types';

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

    const service = youtubeService.getInstance();
    const result = await service.deleteComment(commentId, session.accessToken);

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