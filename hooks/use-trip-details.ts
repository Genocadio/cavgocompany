"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { authenticatedFetch } from "@/lib/auth-client"
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
  refetch: () => Promise<TripResponse | null>
  refetchById: (id: string | number) => Promise<TripResponse | null>
  notFound: boolean
}

export function useTripDetails({ 
  tripId, 
  enabled = true, 
  pollInterval = 60000 
}: UseTripDetailsOptions): UseTripDetailsResult {
  const [tripData, setTripData] = useState<TripResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTrip = useCallback(async (overrideTripId?: string | number) => {
    const effectiveTripId = overrideTripId ?? tripId

    if (!effectiveTripId) {
      setTripData(null)
      return null
    }

    // No localhost fallback: in production that silently fetches the operator's
    // own machine and leaves the focused trip without a route/live location.
    const apiUrl = process.env.NEXT_PUBLIC_NAVIGATION_API_URL || process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      const message = "NEXT_PUBLIC_NAVIGATION_API_URL is not configured"
      setError(message)
      setIsLoading(false)
      return null
    }
    const endpoint = `${apiUrl.replace(/\/$/, "")}/api/trips/${effectiveTripId}?render=true`

    setIsLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const response = await authenticatedFetch(endpoint, {
        method: "GET",
      })

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true)
          setTripData(null)
          setError(null)
          return null
        }
        throw new Error(`Failed to fetch trip: ${response.statusText}`)
      }

      const data: TripResponse = await response.json()
      setTripData(data)
      setError(null)
      setNotFound(false)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch trip"
      setError(errorMessage)
      console.error("[useTripDetails] Error fetching trip:", err)
      setTripData(null)
      // notFound is set above for 404; leave other cases as false
      return null
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
    refetch: () => fetchTrip(),
    refetchById: (id: string | number) => fetchTrip(id),
    notFound,
  }
}
