"use client"

import { useQuery } from "@apollo/client/react"
import { GET_CARS_BY_COMPANY } from "@/lib/graphql/queries"
import type { GetCarsByCompanyResponse, GetCarsByCompanyVariables } from "@/lib/graphql/types"

export function useCarsByCompany(companyId: string | number | null | undefined) {
  const { data, loading, error, refetch } = useQuery<GetCarsByCompanyResponse, GetCarsByCompanyVariables>(
    GET_CARS_BY_COMPANY,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    cars: data?.getCarsByCompany || [],
    loading,
    error,
    refetch,
  }
}

