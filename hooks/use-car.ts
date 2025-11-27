"use client"

import { useQuery } from "@apollo/client/react"
import { GET_CAR } from "@/lib/graphql/queries"
import type { GetCarResponse, GetCarVariables } from "@/lib/graphql/types"

export function useCar(carId: string | null | undefined) {
  const { data, loading, error } = useQuery<GetCarResponse, GetCarVariables>(GET_CAR, {
    variables: {
      carId: String(carId || ""),
    },
    skip: !carId,
    errorPolicy: "all",
  })

  return {
    car: data?.car || null,
    trips: [], // No longer available in new query structure
    loading,
    error,
  }
}

