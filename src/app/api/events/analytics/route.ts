import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';

interface EventMetadata {
  [key: string]: string | number | boolean | null;
}

// Schema for analytics query parameters
const analyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['eventType', 'entityType', 'day', 'hour']).optional().default('eventType'),
});

interface EventAnalytics {
  summary: {
    totalEvents: number;
    uniqueDays: number;
    mostActiveDay: string;
    eventTypes: Record<string, number>;
    entityTypes: Record<string, number>;
  };
  timeline: Array<{
    date: string;
    count: number;
    eventTypes: Record<string, number>;
  }>;
  topEvents: Array<{
    eventType: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    date: string;
    eventType: string;
    entityType: string;
    entityId: string;
    metadata: EventMetadata;
  }>;
}

// GET /api/events/analytics - Get analytics data for user events
export async function GET(request: NextRequest) {
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
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // Create user if they don't exist (since we're using JWT strategy)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = analyticsQuerySchema.parse(queryParams);
    
    const { period, startDate, endDate } = validatedParams;

    // Calculate date range based on period
    const now = new Date();
    let dateRange: { start: Date; end: Date };

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    } else {
      switch (period) {
        case 'day':
          dateRange = {
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            end: now,
          };
          break;
        case 'week':
          dateRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
          };
          break;
        case 'month':
          dateRange = {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
          };
          break;
        case 'year':
          dateRange = {
            start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            end: now,
          };
          break;
        default:
          dateRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
          };
      }
    }

    // Fetch all events in the date range
    const events = await prisma.eventLog.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate summary statistics
    const totalEvents = events.length;
    const uniqueDays = new Set(events.map(e => e.timestamp.toDateString())).size;
    
    // Count events by day to find most active day
    const dayCount: Record<string, number> = {};
    events.forEach(event => {
      const day = event.timestamp.toDateString();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    const mostActiveDay = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'No activity';

    // Count by event types
    const eventTypes: Record<string, number> = {};
    events.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
    });

    // Count by entity types
    const entityTypes: Record<string, number> = {};
    events.forEach(event => {
      entityTypes[event.entityType] = (entityTypes[event.entityType] || 0) + 1;
    });

    // Create timeline data
    const timeline: Array<{ date: string; count: number; eventTypes: Record<string, number> }> = [];
    const timelineMap: Record<string, { count: number; eventTypes: Record<string, number> }> = {};

    events.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { count: 0, eventTypes: {} };
      }
      
      timelineMap[dateKey].count++;
      timelineMap[dateKey].eventTypes[event.eventType] = 
        (timelineMap[dateKey].eventTypes[event.eventType] || 0) + 1;
    });

    // Convert timeline map to array and sort by date
    Object.entries(timelineMap).forEach(([date, data]) => {
      timeline.push({ date, ...data });
    });
    timeline.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top events with percentages
    const topEvents = Object.entries(eventTypes)
      .map(([eventType, count]) => ({
        eventType,
        count,
        percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent activity (last 10 events)
    const recentActivity = events.slice(0, 10).map(event => ({
      date: event.timestamp.toISOString(),
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
    }));

    const analytics: EventAnalytics = {
      summary: {
        totalEvents,
        uniqueDays,
        mostActiveDay,
        eventTypes,
        entityTypes,
      },
      timeline,
      topEvents,
      recentActivity,
    };

    return NextResponse.json<APIResponse<EventAnalytics>>({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Events Analytics API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Invalid query parameters',
        message: error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}