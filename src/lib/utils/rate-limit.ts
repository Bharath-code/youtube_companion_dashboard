import { NextRequest } from 'next/server';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 * In production, this should be replaced with Redis or similar
 */
export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * Check if request is within rate limit
     */
    checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = rateLimitStore.get(identifier);

        // Clean up expired entries periodically
        this.cleanup();

        if (!entry || now > entry.resetTime) {
            // First request or window expired
            const newEntry: RateLimitEntry = {
                count: 1,
                resetTime: now + this.config.windowMs,
            };
            rateLimitStore.set(identifier, newEntry);

            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime: newEntry.resetTime,
            };
        }

        if (entry.count >= this.config.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        // Increment count
        entry.count++;
        rateLimitStore.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Get client identifier for rate limiting
     */
    getClientIdentifier(request: NextRequest, userId?: string): string {
        // Use user ID if available, otherwise fall back to IP
        if (userId) {
            return `user:${userId}`;
        }

        const forwarded = request.headers.get('x-forwarded-for');
        const realIP = request.headers.get('x-real-ip');
        const clientIP = request.headers.get('x-client-ip');

        let ip = 'unknown';
        if (forwarded) {
            ip = forwarded.split(',')[0].trim();
        } else if (realIP) {
            ip = realIP;
        } else if (clientIP) {
            ip = clientIP;
        }

        return `ip:${ip}`;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }
}

// Pre-configured rate limiters
export const notesRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes per user
});

export const strictRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

// YouTube actions rate limiter (comment post/reply/delete)
export const youtubeActionsRateLimiter = new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 30, // 30 actions per 5 minutes per user/IP
});