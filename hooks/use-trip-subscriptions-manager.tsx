"use client"

import type { Car } from "@/lib/data"
import type { CarWithTripId } from "@/hooks/use-company-cars"
import type { TripSubscriptionData } from "@/hooks/use-trip-subscription"

/**
 * ONE authoritative place that turns live trip data into the car view model.
 *
 * Previously the dashboard had two independent override maps plus several
 * `setCarsView` writers that raced each other, so a focused-map or dialog update
 * was silently overwritten on the next poll. Keeping the merge pure and single
 * makes every source (company subscription, map poll, trip dialog) feed the same
 * state.
 */

const isStopPassed = (stop?: { isPassed?: boolean | string }): boolean =>
  stop?.isPassed === true || stop?.isPassed === "true"

export type TripViewOverride = Partial<NonNullable<Car["currentTrip"]>> & { id?: string | number }

export function buildCurrentTripFromSubscription(
  tripData: TripSubscriptionData,
  fallback: Car["currentTrip"]
): Car["currentTrip"] {
  const destinations = tripData.destinations ?? []
  const finalDestination = destinations[destinations.length - 1]
  const origin = tripData.origin
  const nextStop = destinations.find((d) => !isStopPassed(d))
  const remainingKm = destinations
    .filter((d) => !isStopPassed(d))
    .reduce((sum, d) => sum + (d.remainingDistance || 0), 0) / 1000

  const history: [number, number][] = destinations
    .filter((d) => isStopPassed(d) && d.lat && d.lng)
    .map((d) => [d.lat, d.lng])
  if (origin?.lat && origin?.lng) history.unshift([origin.lat, origin.lng])

  const bookedSeats = destinations.filter((d) => (d.fare ?? 0) > 0).length
  const totalRevenue = destinations.reduce((sum, d) => sum + (d.fare || 0), 0)

  return {
    id: String(tripData.id),
    start: origin?.lat && origin?.lng ? [origin.lat, origin.lng] : fallback?.start ?? [0, 0],
    end: finalDestination?.lat && finalDestination?.lng
      ? [finalDestination.lat, finalDestination.lng]
      : fallback?.end ?? [0, 0],
    originName: origin?.addres || fallback?.originName || "Origin",
    destinationName: finalDestination?.addres || fallback?.destinationName || "Destination",
    nextStopName: nextStop?.addres || finalDestination?.addres || fallback?.nextStopName || "Next stop",
    destinations: destinations.map((d) => ({
      id: d.id?.toString() || Math.random().toString(36).slice(2),
      addres: d.addres,
      remainingDistance: d.remainingDistance,
      isPassed: isStopPassed(d),
      index: d.index,
    })),
    history: history.length ? history : fallback?.history ?? [],
    distanceKm: remainingKm > 0 ? Math.round(remainingKm * 10) / 10 : fallback?.distanceKm ?? 0,
    totalDistanceKm: tripData.totalDistance
      ? Math.round((tripData.totalDistance / 1000) * 10) / 10
      : fallback?.totalDistanceKm,
    totalSeats: fallback?.totalSeats ?? 48,
    bookedSeats: bookedSeats || fallback?.bookedSeats || 0,
    totalRevenue: totalRevenue || fallback?.totalRevenue || 0,
    currency: fallback?.currency || "USD",
    status: tripData.status || fallback?.status,
    createdAt: tripData.createdAt || fallback?.createdAt,
  }
}

/**
 * Merge the company-wide live trips into the fetched car list.
 * [ready] is the subscription's connected state: once the backend has sent the
 * initial payload, any trip absent from it has ended and must be cleared right
 * away instead of lingering until the next poll.
 */
export function applyLiveTripsToCars(
  cars: CarWithTripId[],
  trips: TripSubscriptionData[],
  ready: boolean
): CarWithTripId[] {
  if (!ready) return cars

  const tripIds = new Set(trips.map((t) => String(t.id)))
  return cars.map((car) => {
    const carTripId = car.activeTripId || car.currentTrip?.id
    if (carTripId && !tripIds.has(String(carTripId))) {
      // Trip completed/cancelled on another client — drop it immediately.
      return { ...car, activeTripId: undefined, currentTrip: undefined, status: "no-trips" as const }
    }
    const trip = carTripId ? trips.find((t) => String(t.id) === String(carTripId)) : undefined
    if (!trip) return car
    return {
      ...car,
      status: "with-trips" as const,
      currentTrip: buildCurrentTripFromSubscription(trip, car.currentTrip),
    }
  })
}

/**
 * Apply short-lived focused-map / trip-dialog refinements on top of the live
 * car list. Overrides are keyed by trip id so a completed trip simply drops out.
 */
export function applyTripOverrides(
  cars: CarWithTripId[],
  overrides: Map<string, TripViewOverride>
): CarWithTripId[] {
  if (overrides.size === 0) return cars
  return cars.map((car) => {
    const tripId = car.activeTripId || car.currentTrip?.id
    if (!tripId) return car
    const override = overrides.get(String(tripId))
    if (!override) return car
    return {
      ...car,
      currentTrip: {
        ...car.currentTrip,
        ...override,
        id: String(override.id ?? tripId),
      } as Car["currentTrip"],
    }
  })
}
