import { NextResponse } from "next/server"
import { getOptionalServerSession } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await getOptionalServerSession()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      authentication: {
        configured: true,
        userAuthenticated: !!session,
        user: session?.user ? {
          name: session.user.name,
          email: session.user.email,
        } : null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}