"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const TRIP_SUBSCRIPTION = `#graphql
  subscription Trip($tripId: ID!) {
    trip(tripId: $tripId) {
      createdAt
      updatedAt
      totalDistance
      status
      id
      origin {
        id
        addres
        lat
        lng
      }
      destinations {
        id
        addres
        lat
        lng
        index
        fare
        remainingDistance
        isPassede
        passedTime
      }
    }
  }
`

export interface TripDestination {
  id: string
  addres: string
  lat: number
  lng: number
  index: number
  fare?: number
  remainingDistance?: number
  isPassede?: boolean
  passedTime?: string
}

export interface TripOrigin {
  id: string
  addres: string
  lat: number
  lng: number
}

export interface TripSubscriptionData {
  id: string
  createdAt: string
  updatedAt: string
  totalDistance: number
  status: string
  origin: TripOrigin
  destinations: TripDestination[]
}

interface UseTripSubscriptionOptions {
  tripId: string | null | undefined
  enabled?: boolean
  onUpdate?: (data: TripSubscriptionData) => void
  onError?: (error: Error) => void
}

interface UseTripSubscriptionResult {
  data: TripSubscriptionData | null
  isConnected: boolean
  error: string | null
  reconnect: () => void
}

export function useTripSubscription({
  tripId,
  enabled = true,
  onUpdate,
  onError,
}: UseTripSubscriptionOptions): UseTripSubscriptionResult {
  const [data, setData] = useState<TripSubscriptionData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!tripId || !enabled) {
      cleanup()
      return
    }

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    if (!graphqlUrl) {
      const err = new Error("GraphQL API URL is not configured")
      setError(err.message)
      onError?.(err)
      return
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = graphqlUrl.replace(/^http/, "ws")

    cleanup()

    try {
      const ws = new WebSocket(wsUrl, "graphql-ws")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[TripSubscription] WebSocket connected")
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        // GraphQL WS connection init
        ws.send(
          JSON.stringify({
            type: "connection_init",
            payload: {
              headers: {
                Authorization: `Bearer ${
                  typeof window !== "undefined" ? localStorage.getItem("authToken") ?? "" : ""
                }`,
              },
            },
          })
        )
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case "connection_ack":
              console.log("[TripSubscription] Connection acknowledged")
              // Start subscription
              ws.send(
                JSON.stringify({
                  id: `trip-${tripId}`,
                  type: "start",
                  payload: {
                    query: TRIP_SUBSCRIPTION,
                    variables: { tripId },
                  },
                })
              )
              break

            case "data":
              if (message.payload?.data?.trip) {
                const tripData = message.payload.data.trip as TripSubscriptionData
                setData(tripData)
                onUpdate?.(tripData)
              }
              break

            case "error":
              const err = new Error(message.payload?.message || "Subscription error")
              setError(err.message)
              onError?.(err)
              break

            case "complete":
              console.log("[TripSubscription] Subscription completed")
              break

            default:
              console.log("[TripSubscription] Unknown message type:", message.type)
          }
        } catch (err) {
          console.error("[TripSubscription] Failed to parse message:", err)
        }
      }

      ws.onerror = (event) => {
        console.error("[TripSubscription] WebSocket error:", event)
        const err = new Error("WebSocket connection error")
        setError(err.message)
        onError?.(err)
      }

      ws.onclose = (event) => {
        console.log("[TripSubscription] WebSocket closed:", event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null

        // Attempt reconnection with exponential backoff
        if (
          enabled &&
          tripId &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          !event.wasClean
        ) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(
            `[TripSubscription] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (err) {
      console.error("[TripSubscription] Failed to create WebSocket:", err)
      const error = err instanceof Error ? err : new Error("Failed to create WebSocket")
      setError(error.message)
      onError?.(error)
    }
  }, [tripId, enabled, cleanup, onUpdate, onError])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  return {
    data,
    isConnected,
    error,
    reconnect,
  }
}
