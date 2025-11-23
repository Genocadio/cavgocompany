"use client"

import { useQuery } from "@apollo/client/react"
import { GET_BOOKINGS_BY_TRIP } from "@/lib/graphql/queries"
import type { GetBookingsByTripResponse, GetBookingsByTripVariables } from "@/lib/graphql/types"

export function useBookingsByTrip(tripId: string | null | undefined) {
  const { data, loading, error } = useQuery<GetBookingsByTripResponse, GetBookingsByTripVariables>(
    GET_BOOKINGS_BY_TRIP,
    {
      variables: {
        tripId: String(tripId || ""),
      },
      skip: !tripId,
      errorPolicy: "all",
    },
  )

  return {
    bookings: data?.getBookingsByTrip || [],
    loading,
    error,
  }
}






