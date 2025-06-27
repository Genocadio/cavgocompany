"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface UserType {
  name: string;
  role: string | null;
  token?: string;
}

interface AuthContextType {
  user: UserType | null;
  login: (token: string, userData: UserType) => void;
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

  const login = (token: string, userData: UserType) => {
    try {
      localStorage.setItem("authToken", token)
      localStorage.setItem("userName", userData.name)
      localStorage.setItem("userRole", userData.role ?? "")

      // Set cookie for middleware
      document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days

      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userName")
      localStorage.removeItem("userRole")

      // Remove cookie
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

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
