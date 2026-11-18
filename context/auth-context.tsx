"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  clearNexxauthSession,
  accessTokenHasAdminRole,
  fetchCompanyMembership,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  getTokenExpiry,
  hasAdminRole,
  loginWithNexxauth,
  logoutFromNexxauth,
  refreshNexxauthSession,
  saveNexxauthSession,
  type CompanyMembership,
  type NexxAuthUser,
} from "@/lib/auth-client"

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
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function makeUser(
  authUser: NexxAuthUser | null,
  membership: CompanyMembership | null,
  cachedUser: User | null,
): User {
  const firstName = membership?.firstName || authUser?.firstName || ""
  const lastName = membership?.lastName || authUser?.lastName || ""
  const username =
    authUser?.username ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    cachedUser?.username ||
    "Cavgo user"
  const companyId =
    membership && membership.status?.toUpperCase() !== "INACTIVE" ? membership.companyId : null
  const hasActiveMembership = companyId != null

  return {
    userId: membership?.id ?? authUser?.id ?? cachedUser?.userId ?? 0,
    username,
    email: membership?.email || authUser?.email || cachedUser?.email || "",
    phone: membership?.phone || authUser?.phone || cachedUser?.phone || "",
    userType: authUser?.roles?.[0] || cachedUser?.userType || "USER",
    isCompanyUser: Boolean(hasActiveMembership),
    companyId,
    companyName: companyId == null ? null : membership?.companyName ?? null,
    companyUserRole: companyId == null ? null : membership?.role ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const loadUser = useCallback(async (authUser: NexxAuthUser | null = null) => {
    const membership = await fetchCompanyMembership()
    const nextUser = makeUser(authUser, membership, getStoredUser<User>())
    localStorage.setItem("user", JSON.stringify(nextUser))
    setUser(nextUser)
    setToken(getAccessToken())
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    setError(null)
    try {
      const response = await loginWithNexxauth(identifier, password)
      if (!hasAdminRole(response.user.roles) || !accessTokenHasAdminRole(response.accessToken)) {
        clearNexxauthSession()
        throw new Error("Your account does not have the ADMIN role. Cavgo Company access is restricted to company administrators.")
      }
      saveNexxauthSession(response)
      await loadUser(response.user)
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Sign-in failed"
      setError(message)
      throw loginError
    }
  }, [loadUser])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await logoutFromNexxauth()
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Could not revoke the Nexxauth session")
    } finally {
      clearNexxauthSession()
      setUser(null)
      setToken(null)
      router.replace("/login")
    }
  }, [router])

  useEffect(() => {
    const restoreSession = async () => {
      let accessToken = getAccessToken()
      if (!accessToken) {
        setIsLoading(false)
        return
      }

      setToken(accessToken)
      try {
        if (!accessTokenHasAdminRole(accessToken)) {
          clearNexxauthSession()
          return
        }
        const expiry = getTokenExpiry()
        if (getRefreshToken() && expiry != null && expiry <= Date.now() / 1000) {
          accessToken = (await refreshNexxauthSession()) ?? ""
        }
        if (!accessToken) return
        await loadUser()
      } catch (restoreError) {
        setError(restoreError instanceof Error ? restoreError.message : "Could not restore your session")
      } finally {
        setToken(getAccessToken())
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [loadUser])

  useEffect(() => {
    const onSessionUpdated = () => {
      const nextToken = getAccessToken()
      if (nextToken && !accessTokenHasAdminRole(nextToken)) {
        clearNexxauthSession()
        return
      }
      setToken(nextToken)
    }
    const onSessionExpired = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener("cavgo:auth-session-updated", onSessionUpdated)
    window.addEventListener("cavgo:auth-session-expired", onSessionExpired)
    return () => {
      window.removeEventListener("cavgo:auth-session-updated", onSessionUpdated)
      window.removeEventListener("cavgo:auth-session-expired", onSessionExpired)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!user && pathname !== "/login") router.replace("/login")
    if (user && pathname === "/login") router.replace("/")
  }, [isLoading, pathname, router, user])

  useEffect(() => {
    if (!token || !getRefreshToken()) return
    const timer = window.setInterval(() => {
      const expiry = getTokenExpiry()
      if (expiry != null && expiry - Date.now() / 1000 <= 5 * 60) {
        void refreshNexxauthSession().catch((refreshError) => {
          setError(refreshError instanceof Error ? refreshError.message : "Could not refresh your session")
        })
      }
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
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
