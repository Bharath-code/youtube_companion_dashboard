"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Home, Loader2 } from "lucide-react"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "There is a problem with the server configuration. Please contact support."
      case "AccessDenied":
        return "You denied access to the application. Please try signing in again and grant the necessary permissions."
      case "Verification":
        return "The verification token has expired or has already been used. Please try signing in again."
      case "Default":
        return "An error occurred during authentication. Please try again."
      default:
        return "An unexpected authentication error occurred. Please try again."
    }
  }

  const getErrorTitle = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "Configuration Error"
      case "AccessDenied":
        return "Access Denied"
      case "Verification":
        return "Verification Failed"
      default:
        return "Authentication Error"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            {getErrorTitle(error)}
          </CardTitle>
          <CardDescription>
            We encountered an issue while trying to sign you in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/auth/signin">
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            If this problem persists, please contact support with error code: <code className="bg-gray-100 px-1 rounded">{error || "UNKNOWN"}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}