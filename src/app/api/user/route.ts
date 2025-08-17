import { NextResponse } from "next/server"
import { getRequiredServerSession } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await getRequiredServerSession()
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user?.email, // Using email as ID for now
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      },
      accessToken: session.accessToken ? "present" : "missing",
    })
  } catch (error) {
    console.error("User API error:", error)
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    )
  }
}