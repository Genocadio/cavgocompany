"use client"

import { useEffect, useCallback, useState } from "react"
import { useTripSubscription, type TripSubscriptionData } from "@/hooks/use-trip-subscription"
import type { CarWithTripId } from "@/hooks/use-company-cars"
import type { Car } from "@/lib/data"

interface TripSubscriptionManagerProps {
  cars: CarWithTripId[]
  onCarsUpdate: (cars: CarWithTripId[]) => void
}

// Hook to manage multiple trip subscriptions for active cars
export function useTripSubscriptionsManager(cars: CarWithTripId[]): CarWithTripId[] {
  const [updatedCars, setUpdatedCars] = useState<CarWithTripId[]>(cars)
  const [tripDataMap, setTripDataMap] = useState<Map<string, TripSubscriptionData>>(new Map())

  // Update cars when input cars change
  useEffect(() => {
    setUpdatedCars(cars)
  }, [cars])

  // Helper to update trip data in the map
  const handleTripUpdate = useCallback((tripId: string, data: TripSubscriptionData) => {
    setTripDataMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(tripId, data)
      return newMap
    })
  }, [])

  // Apply trip updates to cars whenever tripDataMap changes
  useEffect(() => {
    if (tripDataMap.size === 0) return

    setUpdatedCars((currentCars) =>
      currentCars.map((car) => {
        if (!car.activeTripId) return car

        const tripData = tripDataMap.get(car.activeTripId)
        if (!tripData) return car

        // Build currentTrip from real subscription data
        const remainingKm =
          tripData.destinations
            .filter((d) => !d.isPassede)
            .reduce((sum, d) => sum + (d.remainingDistance || 0), 0) / 1000

        const finalDestination = tripData.destinations[tripData.destinations.length - 1]
        const origin = tripData.origin

        // Build history from passed destinations
        const history: [number, number][] = tripData.destinations
          .filter((d) => d.isPassede && d.lat && d.lng)
          .map((d) => [d.lat, d.lng])

        // Add origin to history
        if (origin?.lat && origin?.lng) {
          history.unshift([origin.lat, origin.lng])
        }

        // Calculate booked seats and revenue from destinations
        const bookedSeats = tripData.destinations.filter((d) => d.fare && d.fare > 0).length
        const totalRevenue = tripData.destinations.reduce((sum, d) => sum + (d.fare || 0), 0)

        return {
          ...car,
          currentTrip: {
            id: tripData.id,
            start: origin?.lat && origin?.lng ? [origin.lat, origin.lng] : car.position,
            end: finalDestination?.lat && finalDestination?.lng
              ? [finalDestination.lat, finalDestination.lng]
              : car.position,
            destinationName: finalDestination?.addres || "Destination",
            history,
            distanceKm: remainingKm > 0 ? Math.round(remainingKm * 10) / 10 : 0,
            totalDistanceKm: tripData.totalDistance ? Math.round((tripData.totalDistance / 1000) * 10) / 10 : undefined,
            totalSeats: 48,
            bookedSeats,
            totalRevenue,
            currency: "USD",
            status: tripData.status,
            createdAt: tripData.createdAt,
          },
        }
      })
    )
  }, [tripDataMap])

  // Subscribe to each active trip
  const activeTripIds = cars
    .filter((car) => car.activeTripId)
    .map((car) => car.activeTripId as string)
    .filter((id, idx, arr) => arr.indexOf(id) === idx) // Unique IDs

  return updatedCars
}

// Individual subscription component (rendered per trip)
function TripSubscriber({
  tripId,
  onUpdate,
}: {
  tripId: string
  onUpdate: (data: TripSubscriptionData) => void
}) {
  useTripSubscription({
    tripId,
    enabled: true,
    onUpdate,
    onError: (error) => {
      console.error(`[TripSubscriber] Error for trip ${tripId}:`, error)
    },
  })

  return null
}

// Component that renders subscription components for all active trips
export function TripSubscriptionManager({ cars, onCarsUpdate }: TripSubscriptionManagerProps) {
  const updatedCars = useTripSubscriptionsManager(cars)

  useEffect(() => {
    onCarsUpdate(updatedCars)
  }, [updatedCars, onCarsUpdate])

  return null
}
