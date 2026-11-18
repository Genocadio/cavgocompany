"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  registerWithNexxauth,
  requestCompanyAdminAccess,
  validateCompanyCode,
} from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonLoginForm } from "@/components/ui/skeleton-card"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [retryRequest, setRetryRequest] = useState<{ companyCode: string; accessToken: string } | null>(null)

  // Redirect to home if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    setNotice(null)
    try {
      if (!isRegistering) {
        await login(emailOrPhone, password)
        router.push("/")
        return
      }

      const code = companyCode.trim()
      if (!code) {
        throw new Error("Company code is required to register for Cavgo Company.")
      }
      await validateCompanyCode(code)

      const authResponse = await registerWithNexxauth({
        firstName,
        lastName,
        emailOrPhone,
        password,
      })
      const request = { companyCode: code, accessToken: authResponse.accessToken }
      setRetryRequest(request)
      await requestCompanyAdminAccess(request.companyCode, request.accessToken)
      setRetryRequest(null)
      setNotice("Your account and company ADMIN access request were submitted. You can sign in once ADMIN access is granted.")
      setIsRegistering(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "The request could not be completed."
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryCompanyRequest = async () => {
    if (!retryRequest) return
    setIsSubmitting(true)
    setFormError(null)
    try {
      await requestCompanyAdminAccess(retryRequest.companyCode, retryRequest.accessToken)
      setRetryRequest(null)
      setIsRegistering(false)
      setNotice("Your company ADMIN access request was submitted. You can sign in once ADMIN access is granted.")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "The company access request could not be sent.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <SkeletonLoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <Image src="/logo.webp" alt="Cavgo" width={48} height={48} priority />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isRegistering ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering
              ? "Register with your company code to request company administrator access."
              : "Sign in to access your fleet management dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">Email or Phone</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="Enter your email or phone"
                autoComplete="username"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="companyCode">Company code</Label>
                <Input
                  id="companyCode"
                  placeholder="Enter your company code"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {(formError || (!isRegistering && error)) && (
              <Alert variant="destructive">
                <AlertDescription>{formError || error}</AlertDescription>
              </Alert>
            )}
            {notice && (
              <Alert>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                isRegistering ? "Register and request admin access" : "Sign in"
              )}
            </Button>
            {retryRequest && (
              <Button type="button" variant="outline" className="w-full" onClick={retryCompanyRequest} disabled={isSubmitting}>
                Retry company access request
              </Button>
            )}
          </form>
          {!retryRequest && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isRegistering ? "Already registered?" : "Need a company account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setIsRegistering((value) => !value)
                  setFormError(null)
                  setNotice(null)
                }}
              >
                {isRegistering ? "Sign in" : "Register"}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
