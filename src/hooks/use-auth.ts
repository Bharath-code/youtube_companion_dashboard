"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const user = session?.user

  const logout = useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: "/auth/signin",
        redirect: false 
      })
      router.push("/auth/signin")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [router])

  const requireAuth = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
      return false
    }
    return true
  }, [isLoading, isAuthenticated, router])

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    logout,
    requireAuth,
    accessToken: session?.accessToken,
    refreshToken: session?.refreshToken,
  }
}