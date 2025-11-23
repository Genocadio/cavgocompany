"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import type { AuthResponseDto, CompanyUserRole } from "@/types"

interface UserType {
  name: string;
  role: string | null;
  token?: string;
  userId?: number;
  username?: string;
  email?: string;
  phone?: string;
  userType?: string;
  isCompanyUser?: boolean;
  companyId?: number | null;
  companyName?: string | null;
  companyUserRole?: CompanyUserRole | null;
}

interface AuthContextType {
  user: UserType | null;
  login: (authResponse: AuthResponseDto) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if current route is an auth route
  const isAuthRoute = pathname?.startsWith("/auth/")

  useEffect(() => {
    // Check for existing auth token on mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken")
        const userData = localStorage.getItem("userName")
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")
        const username = localStorage.getItem("username")
        const email = localStorage.getItem("email")
        const phone = localStorage.getItem("phone")
        const userType = localStorage.getItem("userType")
        const isCompanyUser = localStorage.getItem("isCompanyUser")
        const companyId = localStorage.getItem("companyId")
        const companyName = localStorage.getItem("companyName")
        const companyUserRole = localStorage.getItem("companyUserRole")

        if (token && userData) {
          // Verify the cookie exists too (for middleware)
          const cookieExists = document.cookie.includes("authToken=")

          if (!cookieExists) {
            // Set cookie if it doesn't exist
            document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
          }

          setUser({
            name: String(userData || ""),
            role: userRole !== null ? String(userRole) : null,
            token: token,
            userId: userId ? Number.parseInt(userId, 10) : undefined,
            username: username || undefined,
            email: email || undefined,
            phone: phone || undefined,
            userType: userType || undefined,
            isCompanyUser: isCompanyUser === "true",
            companyId: companyId ? Number.parseInt(companyId, 10) : null,
            companyName: companyName || null,
            companyUserRole: companyUserRole as CompanyUserRole | null,
          })
          setIsAuthenticated(true)
        } else {
          // Clean up any stale cookies
          document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (authResponse: AuthResponseDto) => {
    try {
      console.log("Auth response received:", authResponse)
      
      // Store tokens
      if (!authResponse.accessToken) {
        console.error("Missing accessToken in auth response")
        throw new Error("Invalid authentication response: missing accessToken")
      }
      localStorage.setItem("authToken", authResponse.accessToken)
      localStorage.setItem("refreshToken", authResponse.refreshToken || "")

      // Store user data
      localStorage.setItem("userName", authResponse.username || "")
      localStorage.setItem("userRole", authResponse.companyUserRole || "")
      if (authResponse.userId !== null && authResponse.userId !== undefined) {
        localStorage.setItem("userId", authResponse.userId.toString())
      }
      localStorage.setItem("username", authResponse.username || "")
      localStorage.setItem("email", authResponse.email || "")
      localStorage.setItem("phone", authResponse.phone || "")
      localStorage.setItem("userType", authResponse.userType || "")
      if (authResponse.isCompanyUser !== null && authResponse.isCompanyUser !== undefined) {
        localStorage.setItem("isCompanyUser", authResponse.isCompanyUser.toString())
      }

      // Store company data (required for persistence)
      if (authResponse.companyId !== null) {
        localStorage.setItem("companyId", authResponse.companyId.toString())
      }
      if (authResponse.companyName !== null) {
        localStorage.setItem("companyName", authResponse.companyName)
      }
      if (authResponse.companyUserRole !== null) {
        localStorage.setItem("companyUserRole", authResponse.companyUserRole)
      }

      // Set cookie for middleware
      document.cookie = `authToken=${authResponse.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days

      setUser({
        name: authResponse.username,
        role: authResponse.companyUserRole || null,
        token: authResponse.accessToken,
        userId: authResponse.userId,
        username: authResponse.username,
        email: authResponse.email,
        phone: authResponse.phone,
        userType: authResponse.userType,
        isCompanyUser: authResponse.isCompanyUser,
        companyId: authResponse.companyId,
        companyName: authResponse.companyName,
        companyUserRole: authResponse.companyUserRole,
      })
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const logout = () => {
    try {
      // Clear all localStorage items (comprehensive cleanup)
      localStorage.clear()

      // Remove cookie
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      // Clear Apollo cache if available
      if (typeof window !== "undefined") {
        // Import and clear Apollo cache
        import("@/lib/apollo-client").then(({ apolloClient }) => {
          apolloClient.clearStore().catch((error) => {
            console.error("Error clearing Apollo cache:", error)
          })
        })
      }

      setUser(null)
      setIsAuthenticated(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated && !isAuthRoute ? (
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
