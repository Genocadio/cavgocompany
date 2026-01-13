"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { TripSnapshot } from "@/types"

const GET_TRIP_SNAPSHOT_QUERY = `#graphql
  query GetTripSnapshot($tripId: ID!) {
    getTripSnapshot(tripId: $tripId) {
      tripId
      tripStatus
      lastUpdated
      capacity {
        totalSeats
        availableSeats
        occupiedSeats
        pendingPaymentSeats
        totalAmountPending
        totalAmountPaid
      }
      locations {
        locationId
        addres
        type
        order
        status
        seats {
          pickup
          dropoff
          pendingPayment
          availableFromHere
          totalAmountPaid
          totalAmountPending
        }
      }
      summary {
        totalTickets
        paidTickets
        pendingPayments
        completedDropoffs
      }
    }
  }
`

const TRIP_SNAPSHOT_SUBSCRIPTION = `#graphql
  subscription TripSnapshot($tripId: ID!) {
    tripSnapshot(tripId: $tripId) {
      tripId
      tripStatus
      lastUpdated
      capacity {
        totalSeats
        availableSeats
        occupiedSeats
        pendingPaymentSeats
        totalAmountPending
        totalAmountPaid
      }
      locations {
        locationId
        addres
        type
        order
        status
        seats {
          pickup
          dropoff
          pendingPayment
          availableFromHere
          totalAmountPaid
          totalAmountPending
        }
      }
      summary {
        totalTickets
        paidTickets
        pendingPayments
        completedDropoffs
      }
    }
  }
`

interface UseTripSnapshotOptions {
  tripId?: string | number | null
  enabled?: boolean
  onUpdate?: (data: TripSnapshot) => void
  onError?: (error: Error) => void
}

interface UseTripSnapshotResult {
  snapshot: TripSnapshot | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  refetch: () => Promise<void>
}

export function useTripSnapshot({
  tripId,
  enabled = true,
  onUpdate,
  onError,
}: UseTripSnapshotOptions): UseTripSnapshotResult {
  const [snapshot, setSnapshot] = useState<TripSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Fetch initial data via GraphQL query
  const fetchSnapshot = useCallback(async () => {
    if (!tripId) {
      setSnapshot(null)
      return
    }

    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    if (!endpoint) {
      setError("GraphQL API URL is not configured")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: GET_TRIP_SNAPSHOT_QUERY,
          variables: { tripId: String(tripId) },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch trip snapshot: ${response.statusText}`)
      }

      const json = await response.json()

      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0]?.message || "GraphQL error")
      }

      const data = json.data?.getTripSnapshot
      if (data) {
        setSnapshot(data)
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch trip snapshot"
      setError(errorMessage)
      console.error("[useTripSnapshot] Error fetching snapshot:", err)
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }, [tripId, onError])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Connect to WebSocket subscription
  const connect = useCallback(() => {
    if (!enabled || !tripId) {
      cleanup()
      return
    }

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    if (!graphqlUrl) {
      const err = new Error("GraphQL API URL is not configured")
      setError(err.message)
      if (onError) onError(err)
      return
    }

    const wsUrl = graphqlUrl.replace(/^http/, "ws")

    try {
      // Close existing connection
      cleanup()

      // Try without subprotocol first, as some servers don't support it
      const ws = new WebSocket(wsUrl)
      console.log("[useTripSnapshot] Attempting WebSocket connection to:", wsUrl)

      ws.onopen = () => {
        console.log("[useTripSnapshot] WebSocket connection opened")
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Get auth token for connection
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
        
        // GraphQL WS connection init with auth
        const initMessage: Record<string, any> = {
          type: "connection_init",
          payload: {}
        }
        
        if (token) {
          initMessage.payload.Authorization = `Bearer ${token}`
        }
        
        console.log("[useTripSnapshot] Sending connection_init:", initMessage)
        ws.send(JSON.stringify(initMessage))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("[useTripSnapshot] Received message:", message.type)

          if (message.type === "connection_ack") {
            console.log("[useTripSnapshot] Connection acknowledged, starting subscription")
            // Subscribe to trip snapshot using standard graphql-ws protocol
            ws.send(
              JSON.stringify({
                id: "1",
                type: "subscribe",
                payload: {
                  query: TRIP_SNAPSHOT_SUBSCRIPTION,
                  variables: { tripId: String(tripId) },
                },
              })
            )
          } else if (message.type === "next" && message.payload?.data?.tripSnapshot) {
            const data: TripSnapshot = message.payload.data.tripSnapshot
            console.log("[useTripSnapshot] Received snapshot update:", data)
            setSnapshot(data)
            setError(null)
            if (onUpdate) {
              onUpdate(data)
            }
          } else if (message.type === "data" && message.payload?.data?.tripSnapshot) {
            // Some servers use "data" instead of "next"
            const data: TripSnapshot = message.payload.data.tripSnapshot
            console.log("[useTripSnapshot] Received snapshot update:", data)
            setSnapshot(data)
            setError(null)
            if (onUpdate) {
              onUpdate(data)
            }
          } else if (message.type === "error") {
            console.error("[useTripSnapshot] Subscription error:", message.payload)
            const err = new Error(message.payload?.message || "Subscription error")
            setError(err.message)
            if (onError) onError(err)
          } else if (message.type === "complete") {
            console.log("[useTripSnapshot] Subscription completed")
          }
        } catch (err) {
          console.error("[useTripSnapshot] Error parsing message:", err)
        }
      }

      ws.onerror = (event) => {
        console.error("[useTripSnapshot] WebSocket error:", event)
        const err = new Error("WebSocket connection error")
        setError(err.message)
        setIsConnected(false)
        if (onError) onError(err)
      }

      ws.onclose = (event) => {
        console.log(`[useTripSnapshot] WebSocket closed: ${event.code} ${event.reason}`)
        
        // Log helpful debug info for specific error codes
        if (event.code === 4406) {
          console.warn("[useTripSnapshot] Error 4406: Subprotocol not acceptable. The server may not support the expected GraphQL-WS protocol.")
        } else if (event.code === 1006) {
          console.warn("[useTripSnapshot] Error 1006: Abnormal closure without close frame")
        }
        
        setIsConnected(false)

        // Reconnect if not a normal closure and we haven't exceeded max attempts
        if (
          event.code !== 1000 &&
          enabled &&
          tripId &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(
            `[useTripSnapshot] Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error("[useTripSnapshot] Error creating WebSocket:", err)
      const error = err instanceof Error ? err : new Error("Failed to create WebSocket")
      setError(error.message)
      setIsConnected(false)
      if (onError) onError(error)
    }
  }, [enabled, tripId, onUpdate, onError, cleanup])

  // Initial fetch
  useEffect(() => {
    if (enabled && tripId) {
      fetchSnapshot()
    } else {
      setSnapshot(null)
    }
  }, [enabled, tripId, fetchSnapshot])

  // Start subscription when dialog opens
  useEffect(() => {
    if (enabled && tripId) {
      connect()
    } else {
      cleanup()
    }

    return cleanup
  }, [enabled, tripId, connect, cleanup])

  return {
    snapshot,
    isLoading,
    error,
    isConnected,
    refetch: fetchSnapshot,
  }
}
