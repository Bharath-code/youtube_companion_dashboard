import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { EventLogger } from '@/lib/services/event-logger';
import { EventType, EntityType } from '@/lib/types/database';
import { z } from 'zod';

// Validation schema for event tracking
const trackEventSchema = z.object({
  eventType: z.nativeEnum(EventType),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    
    // Parse request body
    const body = await request.json();
    const validatedData = trackEventSchema.parse(body);

    // Use session user ID if available, otherwise use provided userId
    const userId = session?.user?.id || validatedData.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize event logger
    const eventLogger = new EventLogger();

    // Log the event
    await eventLogger.logEvent({
      eventType: validatedData.eventType,
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      metadata: validatedData.metadata,
      userId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Event tracked successfully' 
    });

  } catch (error) {
    console.error('Event tracking error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid event data',
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: 'Event tracking API',
    timestamp: new Date().toISOString()
  });
}