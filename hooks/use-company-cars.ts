"use client"

import { useCallback, useEffect, useState } from "react"
import { DUMMY_CARS, type Car } from "@/lib/data"

const COMPANY_CARS_QUERY = `#graphql
  query ExampleQuery($companyId: ID!, $limit: Int, $offset: Int) {
    carsByCompany(companyId: $companyId, limit: $limit, offset: $offset) {
      limit
      offset
      total
      items {
        companyId
        capacity
        currentLocation {
          bearing
          location {
            lng
            lat
          }
          speed
          timestamp
        }
        currentDriver {
          id
          name
          phoneNumber
        }
        id
        isOnline
        latestTrip {
          status
          totalDistance
          id
          createdAt
          destinations {
            addres
            id
            lat
            lng
            isPassede
            passedTime
            remainingDistance
            index
          }
          origin {
            addres
            id
            lat
            lng
          }
        }
        model
        plate
        status
      }
    }
  }
`

type ApiTrip = {
  id?: string | number
  status?: string
  totalDistance?: number
  createdAt?: string
  destinations?: Array<{
    addres?: string
    id?: string | number
    lat?: number
    lng?: number
    isPassede?: boolean
    passedTime?: string
    remainingDistance?: number
    index?: number
  }>
  origin?: {
    addres?: string
    id?: string | number
    lat?: number
    lng?: number
  }
}

type ApiCar = {
  id?: string | number
  plate?: string
  isOnline?: boolean
  status?: string
  currentLocation?: {
    bearing?: number
    speed?: number
    location?: {
      lat: number
      lng: number
    }
    timestamp?: string
  }
  latestTrip?: ApiTrip | null
}

interface UseCompanyCarsOptions {
  companyId?: string | number | null
  limit?: number
  offset?: number
}

export interface CarWithTripId extends Car {
  activeTripId?: string
}

interface UseCompanyCarsResult {
  cars: CarWithTripId[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCompanyCars({ companyId, limit = 50, offset = 0 }: UseCompanyCarsOptions): UseCompanyCarsResult {
  const [cars, setCars] = useState<CarWithTripId[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapApiCarsToCars = useCallback((apiCars: ApiCar[]): CarWithTripId[] => {
    return apiCars.map((item) => {
      const hasLatestTrip = Boolean(item?.latestTrip)
      const tripId = item?.latestTrip?.id?.toString()
      const trip = item.latestTrip

      // Build currentTrip from API data
      let currentTrip: Car["currentTrip"] | undefined
      if (hasLatestTrip && trip) {
        const finalDestination = trip.destinations?.[trip.destinations.length - 1]
        const origin = trip.origin
        const nextStop = trip.destinations?.find((d) => !d.isPassede)
        const remainingDistance = trip.destinations
          ?.filter((d) => !d.isPassede)
          .reduce((sum, d) => sum + (d.remainingDistance || 0), 0) || 0

        // Build history from passed destinations
        const history: [number, number][] = trip.destinations
          ?.filter((d) => d.isPassede && d.lat && d.lng)
          .map((d) => [d.lat!, d.lng!]) || []

        // Add origin to history if available
        if (origin?.lat && origin?.lng) {
          history.unshift([origin.lat, origin.lng])
        }

        currentTrip = {
          id: tripId!,
          start: origin?.lat && origin?.lng ? [origin.lat, origin.lng] : [0, 0],
          end: finalDestination?.lat && finalDestination?.lng
            ? [finalDestination.lat, finalDestination.lng]
            : [0, 0],
          originName: origin?.addres || "Origin",
          destinationName: finalDestination?.addres || "Destination",
          nextStopName: nextStop?.addres || finalDestination?.addres || "Next stop",
          destinations: trip.destinations?.map((d) => ({
            id: d.id?.toString() || Math.random().toString(36).slice(2),
            addres: d.addres,
            remainingDistance: d.remainingDistance,
            isPassed: d.isPassede,
            index: d.index,
          })),
          history,
          distanceKm: Math.round((remainingDistance / 1000) * 10) / 10,
          totalDistanceKm: trip.totalDistance ? Math.round((trip.totalDistance / 1000) * 10) / 10 : undefined,
          totalSeats: 48, // Default, can be updated from API if available
          bookedSeats: 0, // Can be updated from booking data
          totalRevenue: 0, // Can be calculated from destinations' fare
          currency: "USD",
          status: trip.status,
          createdAt: trip.createdAt,
        }
      }

      return {
        id: item?.id?.toString() ?? "unknown",
        plateNumber: item?.plate ?? "N/A",
        status: hasLatestTrip ? "with-trips" : "no-trips",
        speed: item?.currentLocation?.speed ?? 0,
        bearing: item?.currentLocation?.bearing ?? 0,
        position: item?.currentLocation?.location
          ? [item.currentLocation.location.lat, item.currentLocation.location.lng]
          : [0, 0],
        gpsTimestamp: item?.currentLocation?.timestamp,
        currentTrip,
        tripHistory: [],
        activeTripId: tripId,
      }
    })
  }, [])

  const fetchCars = useCallback(async () => {
    if (!companyId) {
      setCars([])
      return
    }

    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    if (!endpoint) {
      setError("GraphQL API URL is not configured")
      setCars([])
      return
    }

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
        method: "POST",
        headers,
        body: JSON.stringify({
          query: COMPANY_CARS_QUERY,
          variables: {
            companyId: companyId?.toString(),
            limit,
            offset,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch cars: ${response.statusText}`)
      }

      const json = await response.json()

      if (json?.errors?.length) {
        throw new Error(json.errors[0]?.message || "GraphQL error")
      }

      const apiCars: ApiCar[] = json?.data?.carsByCompany?.items ?? []
      const mappedCars = mapApiCarsToCars(apiCars)
      setCars(mappedCars)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error fetching cars"
      setError(message)
      setCars([])
    } finally {
      setIsLoading(false)
    }
  }, [companyId, limit, mapApiCarsToCars, offset])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  return { cars, isLoading, error, refetch: fetchCars }
}
