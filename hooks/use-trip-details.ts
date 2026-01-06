"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import type { TripResponse } from "@/types"

interface UseTripDetailsOptions {
  tripId?: string | number | null
  enabled?: boolean
  pollInterval?: number // milliseconds, default 60000 (1 minute)
}

interface UseTripDetailsResult {
  tripData: TripResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTripDetails({ 
  tripId, 
  enabled = true, 
  pollInterval = 60000 
}: UseTripDetailsOptions): UseTripDetailsResult {
  const [tripData, setTripData] = useState<TripResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!tripId) {
      setTripData(null)
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_NAVIGATION_API_URL || "http://localhost:8080"
    const endpoint = `${apiUrl}/api/trips/${tripId}?render=true`

    setIsLoading(true)
    setError(null)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Trip not found")
        }
        throw new Error(`Failed to fetch trip: ${response.statusText}`)
      }

      const data: TripResponse = await response.json()
      setTripData(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch trip"
      setError(errorMessage)
      console.error("[useTripDetails] Error fetching trip:", err)
      setTripData(null)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  // Initial fetch
  useEffect(() => {
    if (enabled && tripId) {
      fetchTrip()
    } else {
      setTripData(null)
    }
  }, [enabled, tripId, fetchTrip])

  // Polling
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Set up polling if enabled and tripId exists
    if (enabled && tripId && pollInterval > 0) {
      pollIntervalRef.current = setInterval(() => {
        fetchTrip()
      }, pollInterval)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [enabled, tripId, pollInterval, fetchTrip])

  return {
    tripData,
    isLoading,
    error,
    refetch: fetchTrip,
  }
}
