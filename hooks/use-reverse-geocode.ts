"use client"

import { useState, useEffect, useRef } from "react"

interface ReverseGeocodeCache {
  [key: string]: string
}

// Global cache to persist across component unmounts
const geocodeCache: ReverseGeocodeCache = {}

interface UseReverseGeocodeResult {
  address: string
  isLoading: boolean
}

export function useReverseGeocode(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  existingAddress: string | null | undefined
): UseReverseGeocodeResult {
  const [address, setAddress] = useState<string>(existingAddress || "Unknown")
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // If we have a valid address, use it
    if (existingAddress && existingAddress.trim() !== "" && existingAddress !== "Unknown") {
      setAddress(existingAddress)
      setIsLoading(false)
      return
    }

    // If we don't have coordinates, can't geocode
    if (!latitude || !longitude) {
      setAddress("Unknown")
      setIsLoading(false)
      return
    }

    // Create cache key from coordinates (rounded to 4 decimal places for caching)
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`

    // Check cache first
    if (geocodeCache[cacheKey]) {
      setAddress(geocodeCache[cacheKey])
      setIsLoading(false)
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setAddress("Querying location...")

    // Make reverse geocoding request
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          {
            signal: abortControllerRef.current?.signal,
            headers: {
              "User-Agent": "CavGoCompany/1.0", // Required by Nominatim
            },
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch address")
        }

        const data = await response.json()

        if (data.display_name) {
          const displayName = data.display_name
          // Cache the result
          geocodeCache[cacheKey] = displayName
          setAddress(displayName)
        } else {
          setAddress("Unknown")
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, ignore
          return
        }
        console.error("Reverse geocoding error:", error)
        setAddress("Unknown")
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small delay to avoid rate limiting (Nominatim has strict rate limits)
    const timeoutId = setTimeout(() => {
      fetchAddress()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [latitude, longitude, existingAddress])

  return { address, isLoading }
}

