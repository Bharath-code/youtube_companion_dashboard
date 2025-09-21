'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';
import React from 'react';

interface EventMetadata {
  [key: string]: unknown;
}

interface TrackingOptions {
  metadata?: EventMetadata;
  immediate?: boolean;
}

export function useEventTracking() {
  const { data: session } = useSession();

  const trackEvent = useCallback(async (
    eventType: string,
    entityType: string,
    entityId: string,
    options: TrackingOptions = {}
  ) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/events/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          entityType,
          entityId,
          metadata: options.metadata || {},
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to track event:', eventType);
      }
    } catch (error) {
      console.warn('Event tracking error:', error);
    }
  }, [session?.user?.id]);

  // Specific tracking methods
  const trackPageView = useCallback((page: string, metadata?: EventMetadata) => {
    trackEvent('page_view', 'page', page, { metadata });
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonId: string, metadata?: EventMetadata) => {
    trackEvent('button_click', 'button', buttonId, { metadata });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formId: string, metadata?: EventMetadata) => {
    trackEvent('form_submit', 'form', formId, { metadata });
  }, [trackEvent]);

  const trackModalOpen = useCallback((modalId: string, metadata?: EventMetadata) => {
    trackEvent('modal_open', 'modal', modalId, { metadata });
  }, [trackEvent]);

  const trackModalClose = useCallback((modalId: string, metadata?: EventMetadata) => {
    trackEvent('modal_close', 'modal', modalId, { metadata });
  }, [trackEvent]);

  const trackVideoInteraction = useCallback((videoId: string, action: 'played' | 'paused' | 'seeked', metadata?: EventMetadata) => {
    const eventType = `video_${action}`;
    trackEvent(eventType, 'video', videoId, { metadata });
  }, [trackEvent]);

  const trackSearchPerformed = useCallback((query: string, metadata?: EventMetadata) => {
    trackEvent('search_performed', 'search', 'search_query', { 
      metadata: { query, ...metadata } 
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: string, metadata?: EventMetadata) => {
    trackEvent('client_error', 'system', 'client_error', {
      metadata: {
        error: error.message,
        stack: error.stack,
        context,
        ...metadata,
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackFormSubmit,
    trackModalOpen,
    trackModalClose,
    trackVideoInteraction,
    trackSearchPerformed,
    trackError,
  };
}

// Higher-order component for automatic page view tracking
export function withPageTracking<T extends object>(
  Component: React.ComponentType<T>,
  pageName: string
): React.ComponentType<T> {
  return function TrackedComponent(props: T) {
    const { trackPageView } = useEventTracking();
    
    useEffect(() => {
      trackPageView(pageName);
    }, [trackPageView]);

    return React.createElement(Component, props);
  };
}