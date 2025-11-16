import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { eventLogger } from '@/lib/services/event-logger';
import { notesRateLimiter } from '@/lib/utils/rate-limit';
import { z } from 'zod';
import { getDatabaseConfig } from '@/lib/db-config';

const isPostgres = () => getDatabaseConfig().provider === 'postgresql';

// Validation schemas
const createNoteSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  tags: z.array(z.string()).optional().default([]),
});

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  videoId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: z.enum(['createdAt', 'updatedAt', 'content']).optional().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

// GET /api/notes - Fetch notes with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      await eventLogger.logAuthFailure('Authentication required in GET /api/notes', clientIP, userAgent);
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
      const isPg = isPostgres();
      const createData: Record<string, unknown> = {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      };
      if (isPg) {
        createData['googleId'] = (session.user as { id?: string }).id || session.user.email;
        if ((session as { accessToken?: string }).accessToken) createData['accessToken'] = (session as { accessToken?: string }).accessToken;
        if ((session as { refreshToken?: string }).refreshToken) createData['refreshToken'] = (session as { refreshToken?: string }).refreshToken;
      }
      user = await prisma.user.create({ data: createData as unknown as import('@prisma/client').Prisma.UserCreateInput });
    }

    // Check rate limit
    const clientId = notesRateLimiter.getClientIdentifier(request, user.id);
    const rateLimitResult = notesRateLimiter.checkRateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Handle tags parameter (can be comma-separated string)
    if (queryParams.tags && typeof queryParams.tags === 'string') {
      (queryParams as Record<string, unknown>).tags = queryParams.tags.split(',').filter(Boolean);
    }

    const validatedParams = searchSchema.parse(queryParams);
    const { query, tags, videoId, page, limit, orderBy, orderDirection } = validatedParams;

    // Build where clause for search
    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (videoId) {
      where.videoId = videoId;
    }

    if (query) {
      // Provider-aware text search
      if (isPostgres()) {
        where.content = {
          contains: query,
        };
      } else {
        // SQLite: search content and tags (tags stored as JSON string)
        where.OR = [
          {
            content: {
              contains: query,
            },
          },
          {
            tags: {
              contains: query,
            },
          },
        ];
      }
    }

    if (tags && tags.length > 0) {
      // Provider-aware tag filtering
      const tagConditions = tags.map(tag => (
        isPostgres() 
          ? { tags: { has: tag } }
          : { tags: { contains: `"${tag}"` } }
      ));

      if ((where as Record<string, unknown>).OR) {
        where.AND = [
          { OR: (where as Record<string, unknown>).OR },
          { OR: tagConditions },
        ];
        delete (where as Record<string, unknown>).OR;
      } else {
        where.OR = tagConditions;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notes with pagination
    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: {
          [orderBy]: orderDirection,
        },
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    // Normalize tags for response
    const notesWithParsedTags = notes.map((note) => {
      const raw = (note as unknown as { tags: unknown }).tags;
      const normalized = raw === null || raw === undefined
        ? []
        : Array.isArray(raw)
          ? (raw as string[])
          : (() => { try { return JSON.parse(raw as string) as string[] } catch { return [] as string[] } })();
      return { ...note, tags: normalized };
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Log search event if there are search parameters
    if (query || tags?.length || videoId) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      
      await eventLogger.logSearchPerformed(
        user.id,
        { query, tags, videoId, page, limit },
        clientIP,
        userAgent
      );
    }

    return NextResponse.json<APIResponse<{
      notes: typeof notesWithParsedTags;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>>({
      success: true,
      data: {
        notes: notesWithParsedTags,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Notes GET API error:', error);

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

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      const clientIP = eventLogger.getClientIP(request);
      const userAgent = eventLogger.getUserAgent(request);
      await eventLogger.logAuthFailure('Authentication required in POST /api/notes', clientIP, userAgent);
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
      const isPg = isPostgres();
      const createData: Record<string, unknown> = {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      };
      if (isPg) {
        createData['googleId'] = (session.user as { id?: string }).id || session.user.email;
        if ((session as { accessToken?: string }).accessToken) createData['accessToken'] = (session as { accessToken?: string }).accessToken;
        if ((session as { refreshToken?: string }).refreshToken) createData['refreshToken'] = (session as { refreshToken?: string }).refreshToken;
      }
      user = await prisma.user.create({ data: createData as unknown as import('@prisma/client').Prisma.UserCreateInput });
    }

    // Check rate limit
    const clientId = notesRateLimiter.getClientIdentifier(request, user.id);
    const rateLimitResult = notesRateLimiter.checkRateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Create note in database
    const note = await prisma.note.create({
      data: {
        videoId: validatedData.videoId,
        content: validatedData.content,
        // Cast through unknown to satisfy Prisma types in dev (string) and prod (string[])
        tags: (isPostgres() ? (validatedData.tags ?? []) : JSON.stringify(validatedData.tags ?? [])) as unknown as string,
        userId: user.id,
      },
    });

    // Normalize tags for response
    const raw = (note as unknown as { tags: unknown }).tags;
    const normalized = raw === null || raw === undefined
      ? []
      : Array.isArray(raw)
        ? (raw as string[])
        : (() => { try { return JSON.parse(raw as string) as string[] } catch { return [] as string[] } })();

    const noteWithParsedTags = {
      ...note,
      tags: normalized,
    };

    // Log note creation event
    const clientIP = eventLogger.getClientIP(request);
    const userAgent = eventLogger.getUserAgent(request);
    
    await eventLogger.logNoteCreated(
      user.id,
      note.id,
      validatedData.videoId,
      clientIP,
      userAgent
    );

    return NextResponse.json<APIResponse<typeof noteWithParsedTags>>({
      success: true,
      data: noteWithParsedTags,
      message: 'Note created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Notes POST API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Invalid input data',
        message: error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}