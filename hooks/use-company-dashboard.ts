"use client"

import { useQuery } from "@apollo/client/react"
import { GET_COMPANY_DASHBOARD } from "@/lib/graphql/queries"
import type { GetCompanyDashboardResponse, GetCompanyDashboardVariables } from "@/lib/graphql/types"

export function useCompanyDashboard(companyId: string | number | null | undefined) {
  const { data, loading, error } = useQuery<GetCompanyDashboardResponse, GetCompanyDashboardVariables>(
    GET_COMPANY_DASHBOARD,
    {
      variables: {
        companyId: companyId?.toString() || "",
      },
      skip: !companyId,
      errorPolicy: "all",
    }
  )

  return {
    dashboard: data?.companyDashboard || null,
    loading,
    error,
  }
}

