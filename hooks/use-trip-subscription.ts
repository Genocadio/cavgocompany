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
        isPassed
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
  isPassed?: boolean
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
  const [reconnectTrigger, setReconnectTrigger] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const shouldReconnectRef = useRef(false)
  const isConnectingRef = useRef(false)
  const onUpdateRef = useRef(onUpdate)
  const onErrorRef = useRef(onError)

  // Keep refs updated
  useEffect(() => {
    onUpdateRef.current = onUpdate
    onErrorRef.current = onError
  }, [onUpdate, onError])

  const cleanup = useCallback(() => {
    shouldReconnectRef.current = false
    isConnectingRef.current = false
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

  // Effect to manage connection lifecycle based on tripId and enabled state
  useEffect(() => {
    if (!enabled || !tripId) {
      shouldReconnectRef.current = false
      reconnectAttemptsRef.current = 0
      cleanup()
      return
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("[TripSubscription] Already connecting, skipping")
      return
    }

    // Don't create new connection if already connected or connecting
    const currentState = wsRef.current?.readyState
    if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
      console.log("[TripSubscription] Connection already exists (state:", currentState, "), skipping")
      return
    }

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    if (!graphqlUrl) {
      const err = new Error("GraphQL API URL is not configured")
      setError(err.message)
      onErrorRef.current?.(err)
      return
    }

    const wsUrl = graphqlUrl.replace(/^http/, "ws")
    cleanup()
    isConnectingRef.current = true

    try {
      const ws = new WebSocket(wsUrl)
      console.log("[TripSubscription] Attempting WebSocket connection to:", wsUrl)
      wsRef.current = ws
      shouldReconnectRef.current = true

      ws.onopen = () => {
        console.log("[TripSubscription] WebSocket connected")
        isConnectingRef.current = false
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
        const initMessage: Record<string, any> = {
          type: "connection_init",
          payload: {}
        }
        
        if (token) {
          initMessage.payload.Authorization = `Bearer ${token}`
        }
        
        console.log("[TripSubscription] Sending connection_init:", initMessage)
        ws.send(JSON.stringify(initMessage))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("[TripSubscription] Received message:", message.type)

          switch (message.type) {
            case "connection_ack":
              console.log("[TripSubscription] Connection acknowledged, starting subscription")
              ws.send(
                JSON.stringify({
                  id: `trip-${tripId}`,
                  type: "subscribe",
                  payload: {
                    query: TRIP_SUBSCRIPTION,
                    variables: { tripId: String(tripId) },
                  },
                })
              )
              break

            case "next":
              if (message.payload?.data?.trip) {
                const tripData = message.payload.data.trip as TripSubscriptionData
                console.log("[TripSubscription] Received update via next", tripData)
                setData(tripData)
                onUpdateRef.current?.(tripData)
              }
              break

            case "data":
              if (message.payload?.data?.trip) {
                const tripData = message.payload.data.trip as TripSubscriptionData
                console.log("[TripSubscription] Received update via data", tripData)
                setData(tripData)
                onUpdateRef.current?.(tripData)
              }
              break

            case "error":
              console.error("[TripSubscription] Subscription error:", message.payload)
              const err = new Error(message.payload?.message || "Subscription error")
              setError(err.message)
              onErrorRef.current?.(err)
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
        isConnectingRef.current = false
        const err = new Error("WebSocket connection error")
        setError(err.message)
        setIsConnected(false)
        onErrorRef.current?.(err)
      }

      ws.onclose = (event) => {
        console.log("[TripSubscription] WebSocket closed:", event.code, event.reason)
        
        if (event.code === 4406) {
          console.warn("[TripSubscription] Error 4406: Subprotocol not acceptable.")
        } else if (event.code === 1006) {
          console.warn("[TripSubscription] Error 1006: Abnormal closure without close frame")
        }
        
        isConnectingRef.current = false
        setIsConnected(false)
        wsRef.current = null

        // Attempt reconnection with exponential backoff
        if (
          shouldReconnectRef.current &&
          event.code !== 1000 &&
          enabled &&
          tripId &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(
            `[TripSubscription] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            // Trigger reconnection by updating state
            if (shouldReconnectRef.current && enabled && tripId) {
              setReconnectTrigger(prev => prev + 1)
            }
          }, delay)
        }
      }
    } catch (err) {
      console.error("[TripSubscription] Failed to create WebSocket:", err)
      isConnectingRef.current = false
      const error = err instanceof Error ? err : new Error("Failed to create WebSocket")
      setError(error.message)
      onErrorRef.current?.(error)
    }

    return cleanup
  }, [tripId, enabled, cleanup, reconnectTrigger])

  return {
    data,
    isConnected,
    error,
  }
}
