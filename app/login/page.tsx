"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLogin } from "@/hooks/use-login"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error } = useLogin()
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const authData = await login({ emailOrPhone, password })
      
      // Save auth data to local storage
      localStorage.setItem("authToken", authData.accessToken)
      localStorage.setItem("refreshToken", authData.refreshToken)
      localStorage.setItem("user", JSON.stringify({
        userId: authData.userId,
        username: authData.username,
        email: authData.email,
        phone: authData.phone,
        userType: authData.userType,
        isCompanyUser: authData.isCompanyUser,
        companyId: authData.companyId,
        companyName: authData.companyName,
        companyUserRole: authData.companyUserRole,
      }))

      // Redirect to main app
      router.push("/")
    } catch (err) {
      // Error is already handled by the hook
      console.error("Login failed:", err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-primary-foreground text-lg">V0</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your fleet management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">Email or Phone</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="Enter your email or phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
