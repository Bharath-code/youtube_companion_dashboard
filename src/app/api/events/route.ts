import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';

// Schema for query parameters
const eventsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  eventType: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderBy: z.enum(['timestamp', 'eventType', 'entityType']).optional().default('timestamp'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

// GET /api/events - Get event logs for the authenticated user
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
    const validatedParams = eventsQuerySchema.parse(queryParams);
    
    const { 
      page, 
      limit, 
      eventType, 
      entityType, 
      entityId, 
      startDate, 
      endDate, 
      orderBy, 
      orderDirection 
    } = validatedParams;

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.eventLog.count({
      where: whereClause,
    });

    // Fetch events with pagination
    const events = await prisma.eventLog.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: orderDirection },
    });

    // Parse metadata for each event
    const eventsWithParsedMetadata = events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json<APIResponse<{
      events: typeof eventsWithParsedMetadata;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      filters: {
        eventType?: string;
        entityType?: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
        orderBy: string;
        orderDirection: string;
      };
    }>>({
      success: true,
      data: {
        events: eventsWithParsedMetadata,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          eventType,
          entityType,
          entityId,
          startDate,
          endDate,
          orderBy,
          orderDirection,
        },
      },
    });

  } catch (error) {
    console.error('Events GET API error:', error);

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