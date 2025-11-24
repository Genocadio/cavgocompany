"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bus, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useLogin } from "@/hooks/use-login"

type LoginFormData = {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
};

type LoginErrors = {
  emailOrPhone?: string;
  password?: string;
  general?: string;
};

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()
  const { login: loginApi, isLoading: isApiLoading } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<LoginErrors>({})

  const isLoading = isApiLoading

  // Get redirect URL from search params
  const redirectUrl = searchParams.get("redirect") || "/"

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl)
    }
  }, [isAuthenticated, router, redirectUrl])

  const validateForm = () => {
    const newErrors: LoginErrors = {}

    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = "Email or phone number is required"
    } else {
      // Validate as email or phone
      const isEmail = /\S+@\S+\.\S+/.test(formData.emailOrPhone)
      const isPhone = /^[\d\s\-\+\(\)]+$/.test(formData.emailOrPhone) && formData.emailOrPhone.replace(/\D/g, "").length >= 10

      if (!isEmail && !isPhone) {
        newErrors.emailOrPhone = "Please enter a valid email address or phone number"
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the form errors")
      return
    }

    try {
      const authResponse = await loginApi({
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
      })

      // Use the login function from AuthProvider with full auth response
      login(authResponse)

      toast.success("Welcome back!", {
        description: "Login successful",
      })

      // Small delay to show the toast before redirect
      setTimeout(() => {
        router.push(redirectUrl)
      }, 500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again."
      setErrors({ general: errorMessage })
      toast.error("Login failed", {
        description: errorMessage,
      })
    }
  }

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if ((field === "emailOrPhone" || field === "password") && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
  }

  // Don't render if already authenticated (prevents flash)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your cavgoadmin account</p>
          {redirectUrl !== "/" && <p className="text-sm text-blue-600">You&apos;ll be redirected after login</p>}
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Email or Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="Enter your email or phone number"
                    value={formData.emailOrPhone}
                    onChange={(e) => handleInputChange("emailOrPhone", e.target.value)}
                    className={`pl-10 ${errors.emailOrPhone ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.emailOrPhone && <p className="text-sm text-red-600">{errors.emailOrPhone}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember me
                </Label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 cavgoadmin. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
