"use client"

import { useQuery } from "@apollo/client/react"
import { GET_LIVE_TRIPS } from "@/lib/graphql/queries"
import type { GetLiveTripsResponse, GetLiveTripsVariables } from "@/lib/graphql/types"

export function useLiveTrips(companyId: string | number | null | undefined) {
  const { data, loading, error } = useQuery<GetLiveTripsResponse, GetLiveTripsVariables>(
    GET_LIVE_TRIPS,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    liveTrips: data?.getLiveTrips || [],
    loading,
    error,
  }
}






