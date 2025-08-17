import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getRequiredServerSession() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }
  
  return session
}

export async function getOptionalServerSession() {
  return await auth()
}

export function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  return youtubeRegex.test(url)
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}