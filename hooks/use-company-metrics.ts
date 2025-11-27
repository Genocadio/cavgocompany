"use client"

import { useQuery } from "@apollo/client/react"
import { GET_COMPANY_METRICS } from "@/lib/graphql/queries"
import type { GetCompanyMetricsResponse, GetCompanyMetricsVariables } from "@/lib/graphql/types"

export function useCompanyMetrics(
  companyId: string | number | null | undefined,
  startTime?: number | null,
  endTime?: number | null
) {
  const { data, loading, error, refetch } = useQuery<GetCompanyMetricsResponse, GetCompanyMetricsVariables>(
    GET_COMPANY_METRICS,
    {
      variables: {
        companyId: companyId?.toString() || "",
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    metrics: data?.companyMetrics || null,
    loading,
    error,
    refetch,
  }
}





