"use client"

import { useQuery } from "@apollo/client/react"
import { GET_CAR_METRICS } from "@/lib/graphql/queries"
import type { GetCarMetricsResponse, GetCarMetricsVariables } from "@/lib/graphql/types"

export function useCarMetrics(
  carId: string | null | undefined,
  startDate?: string | null,
  endDate?: string | null
) {
  const { data, loading, error, refetch } = useQuery<GetCarMetricsResponse, GetCarMetricsVariables>(
    GET_CAR_METRICS,
    {
      variables: {
        carId: String(carId || ""),
        startDate: startDate || null,
        endDate: endDate || null,
      },
      skip: !carId,
      errorPolicy: "all",
    }
  )

  return {
    metrics: data?.carMetrics || null,
    loading,
    error,
    refetch,
  }
}
