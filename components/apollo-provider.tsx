"use client"

import { ApolloProvider } from "@apollo/client/react"
import { apolloClient } from "@/lib/apollo-client"
import type React from "react"

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}

