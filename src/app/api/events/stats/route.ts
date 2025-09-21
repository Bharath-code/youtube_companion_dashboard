import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';

interface EventStat {
  eventType: string;
  _count: {
    id: number;
  };
}

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get or create user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get event statistics
    const stats = await prisma.eventLog.groupBy({
      by: ['eventType'],
      where: {
        userId: user.id,
      },
      _count: {
        id: true,
      },
    });

    const formattedStats = stats.reduce((acc: Record<string, number>, stat: EventStat) => {
      acc[stat.eventType] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json<APIResponse<typeof formattedStats>>({
      success: true,
      data: formattedStats,
    });

  } catch (error) {
    console.error('Events stats API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}