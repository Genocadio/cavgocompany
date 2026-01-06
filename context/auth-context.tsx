"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { AuthResponseDto } from "@/types"

interface User {
  userId: number
  username: string
  email: string
  phone: string
  userType: string
  isCompanyUser: boolean
  companyId: number | null
  companyName: string | null
  companyUserRole: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken")
        const userData = localStorage.getItem("user")

        if (token && userData) {
          setUser(JSON.parse(userData))
        } else {
          setUser(null)
          // Redirect to login if not on login page
          if (pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setUser(null)
        if (pathname !== "/login") {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const logout = () => {
    // Clear local storage
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    
    // Clear user state
    setUser(null)
    
    // Redirect to login
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
