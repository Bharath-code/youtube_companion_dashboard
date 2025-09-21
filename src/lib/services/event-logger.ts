import { prisma } from '@/lib/prisma';
import { EventType, EntityType, CreateEventLogInput } from '@/lib/types';

export class EventLogger {
  private static instance: EventLogger;

  static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }
    return EventLogger.instance;
  }

  /**
   * Log an event to the database
   */
  async logEvent(input: CreateEventLogInput): Promise<void> {
    try {
      const { userId, metadata, ...rest } = input;
      const data: any = {
        ...rest,
        metadata: metadata ? JSON.stringify(metadata) : null,
      };
      if (userId) {
        data.userId = userId;
      }

      await prisma.eventLog.create({ data });
    } catch (error) {
      // Log the logging failure but don't throw - requirement 7.6
      console.error('Failed to log event:', error);
      
      // Attempt to log the logging failure
      try {
        const failureData: any = {
          eventType: EventType.API_ERROR,
          entityType: EntityType.USER,
          entityId: input.userId || 'system',
          metadata: JSON.stringify({
            originalEvent: input,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        };

        if (input.userId) {
          failureData.userId = input.userId;
        }

        await prisma.eventLog.create({
          data: failureData,
        });
      } catch (loggingError) {
        console.error('Failed to log the logging failure:', loggingError);
      }
    }
  }

  /**
   * Log a note creation event
   */
  async logNoteCreated(userId: string, noteId: string, videoId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.NOTE_CREATED,
      entityType: EntityType.NOTE,
      entityId: noteId,
      metadata: { videoId },
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log an authentication failure event
   */
  async logAuthFailure(reason: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.AUTH_ERROR,
      entityType: EntityType.USER,
      entityId: 'auth_failure',
      metadata: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a note update event
   */
  async logNoteUpdated(userId: string, noteId: string, changes: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.NOTE_UPDATED,
      entityType: EntityType.NOTE,
      entityId: noteId,
      metadata: { changes },
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a note deletion event
   */
  async logNoteDeleted(userId: string, noteId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.NOTE_DELETED,
      entityType: EntityType.NOTE,
      entityId: noteId,
      metadata: {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a search event
   */
  async logSearchPerformed(userId: string, searchParams: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.SEARCH_PERFORMED,
      entityType: EntityType.NOTE,
      entityId: 'search',
      metadata: searchParams,
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a page view event
   */
  async logPageView(userId: string, page: string, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAGE_VIEW,
      entityType: EntityType.PAGE,
      entityId: page,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a button click event
   */
  async logButtonClick(userId: string, buttonId: string, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.BUTTON_CLICK,
      entityType: EntityType.BUTTON,
      entityId: buttonId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a form submission event
   */
  async logFormSubmit(userId: string, formId: string, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.FORM_SUBMIT,
      entityType: EntityType.FORM,
      entityId: formId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a modal open event
   */
  async logModalOpen(userId: string, modalId: string, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.MODAL_OPEN,
      entityType: EntityType.MODAL,
      entityId: modalId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a modal close event
   */
  async logModalClose(userId: string, modalId: string, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.MODAL_CLOSE,
      entityType: EntityType.MODAL,
      entityId: modalId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a client error event
   */
  async logClientError(userId: string, error: Error, metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.CLIENT_ERROR,
      entityType: EntityType.SYSTEM,
      entityId: 'client_error',
      metadata: {
        error: error.message,
        stack: error.stack,
        ...metadata,
      },
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Log a video interaction event
   */
  async logVideoInteraction(userId: string, videoId: string, action: 'played' | 'paused' | 'seeked', metadata?: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<void> {
    const eventTypeMap = {
      played: EventType.VIDEO_PLAYED,
      paused: EventType.VIDEO_PAUSED,
      seeked: EventType.VIDEO_SEEKED,
    };

    await this.logEvent({
      eventType: eventTypeMap[action],
      entityType: EntityType.VIDEO,
      entityId: videoId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
      userId,
    });
  }

  /**
   * Get client IP address from request headers
   */
  getClientIP(request: Request): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || clientIP || undefined;
  }

  /**
   * Get user agent from request headers
   */
  getUserAgent(request: Request): string | undefined {
    return request.headers.get('user-agent') || undefined;
  }
}

// Export singleton instance
export const eventLogger = EventLogger.getInstance();