"use client"

import { useQuery } from "@apollo/client/react"
import { GET_TRIPS_BY_COMPANY } from "@/lib/graphql/queries"
import type { GetTripsByCompanyResponse, GetTripsByCompanyVariables } from "@/lib/graphql/types"

export function useLiveTrips(companyId: string | number | null | undefined) {
  const { data, loading, error } = useQuery<GetTripsByCompanyResponse, GetTripsByCompanyVariables>(
    GET_TRIPS_BY_COMPANY,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    liveTrips: data?.tripsByCompany || [],
    loading,
    error,
  }
}






