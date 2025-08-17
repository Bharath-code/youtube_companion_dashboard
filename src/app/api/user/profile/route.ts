import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens').optional(),
});

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        displayName: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    return NextResponse.json<APIResponse<typeof user>>({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is already taken (if provided)
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: user.id }, // Exclude current user
        },
      });

      if (existingUser) {
        return NextResponse.json<APIResponse>({
          success: false,
          error: 'Username is already taken',
        }, { status: 400 });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: validatedData.displayName,
        username: validatedData.username,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json<APIResponse<typeof updatedUser>>({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Profile PUT API error:', error);

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