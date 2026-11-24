"use client"

import { useEffect, useRef, useState } from "react"
import { getAccessToken, getGraphqlEndpoint } from "@/lib/auth-client"
import type { TripSubscriptionData } from "@/hooks/use-trip-subscription"

const ACTIVE_COMPANY_TRIPS_SUBSCRIPTION = `#graphql
  subscription ActiveCompanyTrips($companyId: ID!) {
    activeCompanyTrips(companyId: $companyId) {
      id
      createdAt
      updatedAt
      totalDistance
      status
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

interface UseActiveCompanyTripsResult {
  /** All active trips for the company, pushed by the backend on every change. */
  trips: TripSubscriptionData[]
  isConnected: boolean
  /** True only after the backend's initial payload has arrived. */
  isReady: boolean
  error: string | null
}

/**
 * Company-wide live trip subscription.
 *
 * Unlike per-trip subscriptions (which only work for trips already known to the
 * UI), `activeCompanyTrips` is seeded with the current active trips and then
 * re-emitted whenever a trip is created, updated, completed or cancelled. This
 * is what makes new/ended trips appear in the dashboard without a manual
 * `carsByCompany` refetch.
 */
export function useActiveCompanyTrips(companyId?: string | number | null): UseActiveCompanyTripsResult {
  const [trips, setTrips] = useState<TripSubscriptionData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const shouldReconnectRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!companyId) {
      setTrips([])
      setIsReady(false)
      return
    }
    setIsReady(false)

    let disposed = false
    shouldReconnectRef.current = true

    const connect = () => {
      if (disposed) return
      const graphqlUrl = getGraphqlEndpoint()
      const wsUrl = graphqlUrl.replace(/^http/, "ws")

      // The backend uses graphql-transport-ws. Negotiating the subprotocol
      // explicitly avoids 4406 "subprotocol not acceptable" closes at gateways.
      const ws = new WebSocket(wsUrl, "graphql-transport-ws")
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        const token = getAccessToken()
        const init: Record<string, unknown> = { type: "connection_init", payload: {} }
        if (token) (init.payload as Record<string, string>).Authorization = `Bearer ${token}`
        ws.send(JSON.stringify(init))
      }

      ws.onmessage = (event) => {
        if (disposed) return
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case "connection_ack":
              ws.send(JSON.stringify({
                id: `active-company-trips-${companyId}`,
                type: "subscribe",
                payload: {
                  query: ACTIVE_COMPANY_TRIPS_SUBSCRIPTION,
                  variables: { companyId: String(companyId) },
                },
              }))
              break

            case "next":
            case "data": {
              const data = message.payload?.data?.activeCompanyTrips
              if (Array.isArray(data)) {
                setTrips(data as TripSubscriptionData[])
                setIsReady(true)
                setError(null)
              }
              break
            }

            // graphql-transport-ws keepalive: answer server pings, and ignore
            // server pongs. Without this, idle proxies can drop the socket.
            case "ping":
              ws.send(JSON.stringify({ type: "pong", payload: message.payload ?? {} }))
              break
            case "pong":
              break

            case "error":
              console.error("[ActiveCompanyTrips] subscription error:", message.payload)
              setError(message.payload?.message || "Subscription error")
              break

            case "complete":
              break

            default:
              break
          }
        } catch (err) {
          console.error("[ActiveCompanyTrips] failed to parse message:", err)
        }
      }

      ws.onerror = (event) => {
        if (disposed) return
        console.error("[ActiveCompanyTrips] WebSocket error:", event)
        setIsConnected(false)
      }

      ws.onclose = (event) => {
        if (disposed) return
        setIsConnected(false)
        wsRef.current = null
        if (event.code === 4406) {
          console.warn("[ActiveCompanyTrips] subprotocol rejected (4406)")
        }
        if (shouldReconnectRef.current && event.code !== 1000 && reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000)
          reconnectAttemptsRef.current += 1
          reconnectTimerRef.current = setTimeout(connect, delay)
        }
      }
    }

    connect()

    return () => {
      disposed = true
      shouldReconnectRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      const ws = wsRef.current
      wsRef.current = null
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ id: `active-company-trips-${companyId}`, type: "complete" }))
        } catch {
          /* ignore */
        }
      }
      try {
        ws?.close(1000, "unmount")
      } catch {
        /* ignore */
      }
    }
  }, [companyId])

  return { trips, isConnected, isReady, error }
}
