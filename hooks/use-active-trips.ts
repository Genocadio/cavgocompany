"use client"

import { useSubscription } from "@apollo/client/react"
import { ACTIVE_COMPANY_TRIPS_SUBSCRIPTION } from "@/lib/graphql/queries"
import type { ActiveCompanyTripsSubscriptionResponse, ActiveCompanyTripsSubscriptionVariables } from "@/lib/graphql/types"

export function useActiveTrips(companyId: string | number | null | undefined) {
  const { data, loading, error } = useSubscription<
    ActiveCompanyTripsSubscriptionResponse,
    ActiveCompanyTripsSubscriptionVariables
  >(
    ACTIVE_COMPANY_TRIPS_SUBSCRIPTION,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    activeTrips: data?.activeCompanyTrips || [],
    loading,
    error,
  }
}


