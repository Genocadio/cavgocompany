"use client"

import { useQuery } from "@apollo/client/react"
import { GET_COMPANY_DRIVERS } from "@/lib/graphql/queries"
import type { GetCompanyDriversResponse, GetCompanyDriversVariables } from "@/lib/graphql/types"

export function useCompanyDrivers(companyId: string | number | null | undefined) {
  const { data, loading, error } = useQuery<GetCompanyDriversResponse, GetCompanyDriversVariables>(
    GET_COMPANY_DRIVERS,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    drivers: data?.getCompanyDrivers || [],
    loading,
    error,
  }
}






