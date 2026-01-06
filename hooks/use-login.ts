"use client"

import { useState } from "react"
import type { LoginRequestDto, AuthResponseDto } from "@/types"

interface UseLoginReturn {
  login: (credentials: LoginRequestDto) => Promise<AuthResponseDto>
  isLoading: boolean
  error: string | null
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: LoginRequestDto): Promise<AuthResponseDto> => {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_LOGIN_API_URL

      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }))
        throw new Error(errorData.message || `Login failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Login API response:", data)
      return data as AuthResponseDto
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
