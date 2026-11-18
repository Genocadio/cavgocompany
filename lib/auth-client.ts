"use client"

export interface NexxAuthUser {
  id: number
  firstName?: string
  lastName?: string
  username?: string
  email?: string
  phone?: string
  enabled: boolean
  roles: string[]
}

export interface NexxAuthResponse {
  accessToken: string
  refreshToken: string | null
  expiresInSeconds?: number
  user: NexxAuthUser
}

export interface NexxAuthRegistration {
  firstName: string
  lastName: string
  emailOrPhone: string
  password: string
}

export interface CompanyMembership {
  id: number
  companyId: number | null
  companyName: string | null
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string | null
  status?: string
}

const ACCESS_TOKEN_KEY = "authToken"
const REFRESH_TOKEN_KEY = "refreshToken"
const TOKEN_EXPIRY_KEY = "authExpiresAt"
const USER_KEY = "user"
const SESSION_UPDATED_EVENT = "cavgo:auth-session-updated"
const SESSION_EXPIRED_EVENT = "cavgo:auth-session-expired"

let refreshInFlight: Promise<string | null> | null = null

function nexxAuthConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_NEXXAUTH_BASE_URL?.replace(/\/+$/, "")
  const clientId = process.env.NEXT_PUBLIC_NEXXAUTH_CLIENT_ID
  if (!baseUrl || !clientId) {
    throw new Error("Cavgo sign-in is not configured. Contact support.")
  }
  return { baseUrl, clientId }
}

export function getGatewayBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")
  if (configuredUrl) return configuredUrl

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://api.gocavgo.com"
  }
  return "http://localhost:8080"
}

export function getGraphqlEndpoint(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL?.replace(/\/+$/, "")
  return configuredUrl || `${getGatewayBaseUrl()}/agg/graphql`
}

function nexxAuthHeaders(clientId: string): Headers {
  return new Headers({ "Content-Type": "application/json", "X-Client-Id": clientId })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}))
  if (body && typeof body === "object") {
    if ("message" in body && typeof body.message === "string") return body.message.replace(/nexxauth/gi, "Cavgo")
    if ("error" in body && typeof body.error === "string") return body.error.replace(/nexxauth/gi, "Cavgo")
  }
  return `${fallback} (HTTP ${response.status})`
}

export async function loginWithNexxauth(identifier: string, password: string): Promise<NexxAuthResponse> {
  const { baseUrl, clientId } = nexxAuthConfig()
  const trimmedIdentifier = identifier.trim()
  const isEmail = trimmedIdentifier.includes("@")

  let response: Response
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: nexxAuthHeaders(clientId),
      body: JSON.stringify({
        identifier: trimmedIdentifier,
        identifierType: isEmail ? "EMAIL" : "PHONE",
        authType: "PASSWORD",
        password,
      }),
    })
  } catch {
    throw new Error("Could not reach Cavgo sign-in. Check your connection and try again.")
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Sign-in failed"))
  }

  const data = (await response.json()) as Partial<NexxAuthResponse>
  if (!data.accessToken || !data.user?.id) {
    throw new Error("Sign-in failed to return a complete account.")
  }
  return data as NexxAuthResponse
}

export async function registerWithNexxauth(input: NexxAuthRegistration): Promise<NexxAuthResponse> {
  const { baseUrl, clientId } = nexxAuthConfig()
  const identifier = input.emailOrPhone.trim()
  const isEmail = identifier.includes("@")
  const body: Record<string, string> = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    password: input.password,
  }
  body[isEmail ? "email" : "phone"] = identifier

  let response: Response
  try {
    response = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: nexxAuthHeaders(clientId),
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error("Could not reach Cavgo sign-in. Check your connection and try again.")
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Registration failed"))
  }

  const data = (await response.json()) as Partial<NexxAuthResponse>
  if (!data.accessToken || !data.user?.id) {
    throw new Error("Your account was created, but sign-in could not be completed.")
  }
  return data as NexxAuthResponse
}

export async function validateCompanyCode(companyCode: string): Promise<void> {
  const response = await fetch(`${getGatewayBaseUrl()}/main/company-admin-access-requests/validate-company-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyCode: companyCode.trim() }),
  })
  if (response.status === 404) {
    throw new Error("That company code was not found. Check the code and try again.")
  }
  if (!response.ok) {
    throw new Error(await readError(response, "Could not validate the company code"))
  }
}

export async function requestCompanyAdminAccess(companyCode: string, accessToken: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${getGatewayBaseUrl()}/main/company-admin-access-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ companyCode: companyCode.trim() }),
    })
  } catch {
    throw new Error("Your Cavgo account was created, but the company access request could not be sent.")
  }

  if (!response.ok) {
    throw new Error(await readError(response, "Your Cavgo account was created, but the company access request failed"))
  }
}

export function hasAdminRole(roles: string[] | undefined): boolean {
  return roles?.some((role) => role.trim().toUpperCase() === "ADMIN") ?? false
}

export function accessTokenHasAdminRole(token: string): boolean {
  try {
    const payload = token.split(".")[1]
    if (!payload) return false
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(atob(normalized)) as { roles?: unknown }
    return Array.isArray(decoded.roles) && hasAdminRole(decoded.roles.filter((role): role is string => typeof role === "string"))
  } catch {
    return false
  }
}

export function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as T) : null
  } catch {
    return null
  }
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof decoded.exp === "number" ? decoded.exp : null
  } catch {
    return null
  }
}

export function getTokenExpiry(): number | null {
  if (typeof window === "undefined") return null
  const storedExpiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY))
  if (Number.isFinite(storedExpiry) && storedExpiry > 0) return storedExpiry
  const token = getAccessToken()
  return token ? tokenExpiry(token) : null
}

function saveSession(data: Pick<NexxAuthResponse, "accessToken" | "refreshToken" | "expiresInSeconds">) {
  localStorage.removeItem(USER_KEY)
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  const expiry =
    typeof data.expiresInSeconds === "number"
      ? Math.floor(Date.now() / 1000 + data.expiresInSeconds)
      : tokenExpiry(data.accessToken)
  if (expiry && Number.isFinite(expiry) && expiry > 0) localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry))
  else localStorage.removeItem(TOKEN_EXPIRY_KEY)
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT))
}

export function saveNexxauthSession(data: NexxAuthResponse): void {
  saveSession(data)
}

export function clearNexxauthSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export async function refreshNexxauthSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshInFlight = (async () => {
    const { baseUrl, clientId } = nexxAuthConfig()
    let response: Response
    try {
      response = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: nexxAuthHeaders(clientId),
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      throw new Error("Could not reach Cavgo to refresh your session.")
    }

    if (!response.ok) {
      clearNexxauthSession()
      return null
    }

    const data = (await response.json()) as Partial<NexxAuthResponse>
    if (!data.accessToken || !accessTokenHasAdminRole(data.accessToken)) {
      clearNexxauthSession()
      return null
    }
    saveSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
      expiresInSeconds: data.expiresInSeconds,
    })
    return data.accessToken
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function logoutFromNexxauth(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return

  const { baseUrl, clientId } = nexxAuthConfig()
  const response = await fetch(`${baseUrl}/auth/logout`, {
    method: "POST",
    headers: nexxAuthHeaders(clientId),
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    throw new Error(await readError(response, "Could not end your Cavgo session"))
  }
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const run = (token: string | null) => {
    const headers = new Headers(init.headers)
    if (token) headers.set("Authorization", `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }

  const response = await run(getAccessToken())
  if (response.status !== 401) return response

  if (!getRefreshToken()) {
    clearNexxauthSession()
    return response
  }

  const refreshedToken = await refreshNexxauthSession()
  if (!refreshedToken) return response
  const retryResponse = await run(refreshedToken)
  if (retryResponse.status === 401) clearNexxauthSession()
  return retryResponse
}

export async function fetchCompanyMembership(): Promise<CompanyMembership | null> {
  const response = await authenticatedFetch(`${getGatewayBaseUrl()}/main/staff/me`)
  if (response.status === 204) return null
  if (!response.ok) {
    throw new Error(await readError(response, "Could not load your Cavgo company membership"))
  }
  return (await response.json()) as CompanyMembership
}
