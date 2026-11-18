"use client"

import { useCallback, useEffect, useState } from "react"
import { authenticatedFetch, getGraphqlEndpoint } from "@/lib/auth-client"
import type { CarTrip } from "@/types"

const TRIPS_BY_CAR_QUERY = `#graphql
  query TripsByCar($carId: ID!) {
    tripsByCar(carId: $carId) {
      createdAt
      destinations {
        id
        addres
        lat
        lng
        index
        fare
        remainingDistance
        isPassed
        passedTime
      }
      id
      origin {
        id
        addres
        lat
        lng
      }
      status
      totalDistance
      updatedAt
    }
  }
`

interface UseTripsByCarOptions {
  carId?: string | null
  enabled?: boolean
}

interface UseTripsByCarResult {
  trips: CarTrip[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTripsByCar({
  carId,
  enabled = true,
}: UseTripsByCarOptions): UseTripsByCarResult {
  const [trips, setTrips] = useState<CarTrip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!carId) {
      setTrips([])
      return
    }

    const endpoint = getGraphqlEndpoint()

    setIsLoading(true)
    setError(null)

    try {
      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: TRIPS_BY_CAR_QUERY,
          variables: { carId: String(carId) },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch trips: ${response.statusText}`)
      }

      const json = await response.json()

      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0]?.message || "GraphQL error")
      }

      const data = json.data?.tripsByCar || []
      setTrips(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch trips"
      setError(errorMessage)
      console.error("[useTripsByCar] Error fetching trips:", err)
      setTrips([])
    } finally {
      setIsLoading(false)
    }
  }, [carId])

  useEffect(() => {
    if (enabled && carId) {
      fetchTrips()
    } else {
      setTrips([])
    }
  }, [enabled, carId, fetchTrips])

  return {
    trips,
    isLoading,
    error,
    refetch: fetchTrips,
  }
}
