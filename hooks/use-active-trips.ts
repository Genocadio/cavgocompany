"use client"

import { useQuery } from "@apollo/client/react"
import { GET_ACTIVE_TRIPS } from "@/lib/graphql/queries"
import type { GetActiveTripsResponse, GetActiveTripsVariables } from "@/lib/graphql/types"

export function useActiveTrips(companyId: string | number | null | undefined) {
  const { data, loading, error, refetch } = useQuery<GetActiveTripsResponse, GetActiveTripsVariables>(
    GET_ACTIVE_TRIPS,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    activeTrips: data?.getActiveCompanyTrips || [],
    loading,
    error,
    refetch,
  }
}


