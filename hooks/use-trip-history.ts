"use client"

import { useQuery } from "@apollo/client/react"
import { GET_TRIP_HISTORY } from "@/lib/graphql/queries"
import type { GetTripHistoryResponse, GetTripHistoryVariables } from "@/lib/graphql/types"

export function useTripHistory(companyId: string | number | null | undefined, limit?: number | null) {
  const { data, loading, error } = useQuery<GetTripHistoryResponse, GetTripHistoryVariables>(
    GET_TRIP_HISTORY,
    {
      variables: {
        companyId: companyId?.toString() || "",
        limit: limit || null,
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    tripHistory: data?.getTripHistory || [],
    loading,
    error,
  }
}






