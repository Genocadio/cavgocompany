"use client"

import { ApolloClient, InMemoryCache, createHttpLink, from, split } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient } from "graphql-ws"
import { getMainDefinition } from "@apollo/client/utilities"

const httpUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql"
// Convert HTTP URL to WebSocket URL
const getWsUrl = (url: string): string => {
  if (url.startsWith("https://")) {
    return url.replace("https://", "wss://")
  }
  if (url.startsWith("http://")) {
    return url.replace("http://", "ws://")
  }
  // If no protocol, assume ws://
  return `ws://${url}`
}
const wsUrl = getWsUrl(httpUrl)

const httpLink = createHttpLink({
  uri: httpUrl,
})

// Create WebSocket client for subscriptions (only on client side)
const wsClient = typeof window !== "undefined" 
  ? createClient({
      url: wsUrl,
      connectionParams: () => {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
          return token ? { authorization: `Bearer ${token}` } : {}
        } catch (error) {
          console.error("Error getting auth token for WebSocket:", error)
          return {}
        }
      },
      shouldRetry: () => true,
    })
  : null

// Create WebSocket link (only on client side)
const wsLink = typeof window !== "undefined" && wsClient ? new GraphQLWsLink(wsClient) : null

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from localStorage if it exists
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graphQLErrors.forEach(({ message, locations, path }: any) => {
      // Filter out introspection errors - these are server-side configuration issues
      // and shouldn't break the client application
      if (message.includes("GraphQL introspection is not allowed")) {
        console.warn("GraphQL introspection is disabled on the server. This is expected in production.")
        return
      }
      
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

// Split link: use WebSocket for subscriptions, HTTP for queries and mutations
const splitLink = typeof window !== "undefined" && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        )
      },
      wsLink,
      from([errorLink, authLink, httpLink])
    )
  : from([errorLink, authLink, httpLink])

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
  },
})




