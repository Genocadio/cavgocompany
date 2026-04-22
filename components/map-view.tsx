"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre"
import type { MapRef } from "react-map-gl/maplibre"
import type { Car } from "@/lib/data"
import type { WaypointProgressDto } from "@/types"
import { Card } from "@/components/ui/card"
import { Navigation, Search, Ticket, Maximize2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTripDetails } from "@/hooks/use-trip-details"
import { useTripSnapshot } from "@/hooks/use-trip-snapshot"
import { SkeletonBookingSummary } from "@/components/ui/skeleton-card"
import { formatSpeed, parseTimestampToDate, reverseGeocode } from "@/lib/utils"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import "maplibre-gl/dist/maplibre-gl.css"

// MapPopupContent component with geocoding
function MapPopupContent({
  car,
  onZoomOut,
  onOpenBooking,
  isDark,
}: {
  car: Car
  onZoomOut: () => void
  onOpenBooking: () => void
  isDark: boolean
}) {
  const [location, setLocation] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedRef = useRef(false)

  const handleMouseEnter = () => {
    if (!car.position || hasLoadedRef.current) return

    hoverTimerRef.current = setTimeout(async () => {
      setIsLoadingLocation(true)
      const locationName = await reverseGeocode(car.position[0], car.position[1])
      setLocation(locationName)
      setIsLoadingLocation(false)
      hasLoadedRef.current = true
    }, 3000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  return (
    <div
      className="p-1 min-w-[180px] bg-card text-card-foreground border border-border rounded-md shadow-lg"
      style={{
        backgroundColor: isDark ? '#0b0b0b' : 'var(--color-card)',
        color: isDark ? '#fff' : 'var(--color-card-foreground)',
        borderColor: isDark ? '#222' : 'var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-lg leading-none mb-1">{car.plateNumber}</h3>
        <div className="ml-2 flex items-center gap-2">
          {car.currentTrip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBooking}
              className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-2"
              title="View trip bookings"
            >
              <Ticket className="w-4 h-4 text-blue-500" />
            </Button>
          )}
          <button
            onClick={onZoomOut}
            title="Zoom out"
            className="p-1 rounded bg-background/50 hover:bg-background/70 text-muted-foreground"
            aria-label="Zoom out"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex justify-between text-xs mt-2 border-t pt-2 border-border/50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Speed</span>
        <span className="font-mono">{formatSpeed(car.speed)} km/h</span>
      </div>
      {(isLoadingLocation || location) && (
        <div className="text-[10px] text-muted-foreground mt-1 italic">
          {isLoadingLocation ? "Loading location..." : location}
        </div>
      )}
      {car.currentTrip && (
        <div className="mt-3 bg-red-500/10 p-2 rounded border border-red-500/20">
          <p className="text-xs font-medium truncate opacity-90">
            {car.currentTrip.originName && car.currentTrip.destinationName
              ? `${car.currentTrip.originName} → ${car.currentTrip.destinationName}`
              : car.currentTrip.destinationName}
          </p>
        </div>
      )}
    </div>
  )
}

export default function MapView({
  cars,
  focusedCarId,
  onFocusCar,
  onFocusedCarTripUpdate,
}: {
  cars: Car[]
  focusedCarId?: string
  onFocusCar: (id: string | undefined) => void
  onFocusedCarTripUpdate?: (carId: string, tripData: any) => void
}) {
  const mapRef = useRef<MapRef>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [showLocationWarning, setShowLocationWarning] = useState(false)
  const [popupInfo, setPopupInfo] = useState<Car | null>(null)
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')
  const [hoveredCar, setHoveredCar] = useState<Car | null>(null)

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  // Filter cars with and without location
  const carsWithLocation = useMemo(
    () => cars.filter((car) => car.position && car.position[0] !== 0 && car.position[1] !== 0),
    [cars]
  )

  const carsWithoutLocation = useMemo(
    () => cars.filter((car) => !car.position || car.position[0] === 0 || car.position[1] === 0),
    [cars]
  )

  const focusedCar = useMemo(
    () => carsWithLocation.find((c) => c.id === focusedCarId),
    [carsWithLocation, focusedCarId]
  )
  const hasValidPosition = useCallback((pos?: [number, number]) => !!pos && pos[0] !== 0 && pos[1] !== 0, [])

  // Fetch trip details for focused car if it has a trip
  const { toast } = useToast()
  const lastNotifiedTripIdRef = useRef<string | undefined>(undefined)

  const {
    tripData,
    isLoading: tripLoading,
    error: tripError,
    notFound,
    refetchById,
  } = useTripDetails({
    tripId: focusedCar?.activeTripId,
    enabled: !!focusedCar && !!focusedCar.activeTripId,
    pollInterval: 30000, // 30 seconds for live navigation
  })

  // Notify parent when focused car's trip data changes from polling
  useEffect(() => {
    if (tripData && focusedCar?.id) {
      onFocusedCarTripUpdate?.(focusedCar.id, tripData)
    }
  }, [tripData, focusedCar?.id, onFocusedCarTripUpdate])

  // Fetch trip snapshot for booking details
  const isInactiveStatus = (status?: string | null) => {
    if (!status) return false
    const s = status.toLowerCase()
    return s.includes('completed') || s.includes('cancelled')
  }

  const focusedTripActive = focusedCar?.currentTrip && !isInactiveStatus((focusedCar as any)?.currentTrip?.status)

  const {
    snapshot,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useTripSnapshot({
    tripId: focusedTripActive ? focusedCar?.currentTrip?.id : null,
    enabled: bookingDialogOpen && !!focusedCar?.currentTrip && !!focusedTripActive,
  })

  // Get location name from trip data
  const getLocationName = useCallback(
    (locationId: string, type: string, order: number) => {
      // First, try to get from snapshot data (most accurate for bookings)
      if (snapshot?.locations) {
        const snapshotLocation = snapshot.locations.find((l) => l.locationId === locationId)
        if (snapshotLocation?.addres) {
          return snapshotLocation.addres
        }
      }

      // Try to match from trip waypoints
      if (tripData?.trip?.waypoints) {
        const waypoint = tripData.trip.waypoints.find((w) => w.id === locationId)
        if (waypoint?.name) {
          return waypoint.name
        }
      }

      // Fallback to type-based names
      if (type === "ORIGIN") {
        return "Origin"
      }

      if (type === "DESTINATION") {
        if (order === 1 && focusedCar?.currentTrip?.destinationName) {
          return focusedCar.currentTrip.destinationName
        }
        return `Stop ${order}`
      }

      return `Location ${locationId.substring(0, 8)}`
    },
    [snapshot, tripData, focusedCar]
  )

  useEffect(() => {
    const activeTripId = focusedCar?.activeTripId
    if (!activeTripId) {
      lastNotifiedTripIdRef.current = undefined
      return
    }
    if (notFound && lastNotifiedTripIdRef.current !== activeTripId) {
      toast({
        title: "Map data not found",
        description: "Trip details for this car could not be found.",
      })
      lastNotifiedTripIdRef.current = activeTripId
    }
    if (!notFound && lastNotifiedTripIdRef.current === activeTripId) {
      // reset if later becomes available (rare)
      lastNotifiedTripIdRef.current = undefined
    }
  }, [notFound, focusedCar?.activeTripId, toast])

  // Kigali, Rwanda coordinates as default center
  const KIGALI_CENTER: [number, number] = [30.0606, -1.9536] // lng, lat for MapLibre

  const initialViewState = useMemo(() => {
    if (focusedCar?.position && hasValidPosition(focusedCar.position)) {
      return {
        longitude: focusedCar.position[1],
        latitude: focusedCar.position[0],
        zoom: 13,
      }
    }
    if (carsWithLocation.length > 0) {
      return {
        longitude: carsWithLocation[0].position[1],
        latitude: carsWithLocation[0].position[0],
        zoom: 13,
      }
    }
    return {
      longitude: KIGALI_CENTER[0],
      latitude: KIGALI_CENTER[1],
      zoom: 12,
    }
  }, [focusedCar, carsWithLocation, hasValidPosition])

  // Close dialogs when exiting focus
  useEffect(() => {
    if (!focusedCar) {
      setBookingDialogOpen(false)
    }
  }, [focusedCar])

  // Show popup when car is focused externally (e.g., from "View on Map" button)
  useEffect(() => {
    if (focusedCar && !popupInfo) {
      setPopupInfo(focusedCar)
    }
  }, [focusedCar, popupInfo])

  // Update map view when focused car changes
  useEffect(() => {
    if (focusedCar?.position && mapRef.current) {
      mapRef.current.flyTo({
        center: [focusedCar.position[1], focusedCar.position[0]],
        zoom: 15,
        duration: 1000,
      })
    } else if (!focusedCar && carsWithLocation.length > 0 && mapRef.current) {
      // Fit all cars in view
      const bounds = carsWithLocation.reduce(
        (acc, car) => {
          return [
            [Math.min(acc[0][0], car.position[1]), Math.min(acc[0][1], car.position[0])],
            [Math.max(acc[1][0], car.position[1]), Math.max(acc[1][1], car.position[0])],
          ]
        },
        [
          [carsWithLocation[0].position[1], carsWithLocation[0].position[0]],
          [carsWithLocation[0].position[1], carsWithLocation[0].position[0]],
        ]
      )

      mapRef.current.fitBounds(bounds as any, {
        padding: 64,
        maxZoom: 14,
        duration: 1000,
      })
      setPopupInfo(null)
    }
  }, [focusedCar, carsWithLocation])

  // Helper to format time ago from ISO timestamp
  const formatTimeAgo = (isoTimestamp?: string | number | null) => {
    if (isoTimestamp == null) return null
    try {
      const date = parseTimestampToDate(isoTimestamp)
      if (!date) return null
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch (e) {
      return null
    }
  }

  // Helper to format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Zoom out / reset focus to show all cars
  const handleZoomOut = () => {
    onFocusCar(undefined)
    setPopupInfo(null)
    if (carsWithLocation.length > 0 && mapRef.current) {
      const bounds = carsWithLocation.reduce(
        (acc, car) => {
          return [
            [Math.min(acc[0][0], car.position[1]), Math.min(acc[0][1], car.position[0])],
            [Math.max(acc[1][0], car.position[1]), Math.max(acc[1][1], car.position[0])],
          ]
        },
        [
          [carsWithLocation[0].position[1], carsWithLocation[0].position[0]],
          [carsWithLocation[0].position[1], carsWithLocation[0].position[0]],
        ]
      )

      mapRef.current.fitBounds(bounds as any, {
        padding: 64,
        maxZoom: 14,
        duration: 800,
      })
    }
  }

  // Create car icon component
  const CarIcon = ({ bearing, color = "#3b82f6" }: { bearing: number; color?: string }) => (
    <div style={{ transform: `rotate(${bearing}deg)` }}>
      <svg width="28" height="32" viewBox="0 0 24 32" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Map pin shape */}
        <path d="M 12 2 C 7 2 3 6 3 11 C 3 18 12 30 12 30 C 12 30 21 18 21 11 C 21 6 17 2 12 2 Z" 
              fill={color} stroke="white" strokeWidth="0.8"/>
        
        {/* White circle background for bus */}
        <circle cx="12" cy="10" r="5.5" fill="white"/>
        
        {/* Bus inside the pin */}
        {/* Bus body */}
        <rect x="8" y="6.5" width="8" height="6" rx="0.8" fill={color}/>
        
        {/* Front windshield */}
        <rect x="8.5" y="7" width="2.5" height="2" fill="rgba(255,255,255,0.6)" rx="0.3"/>
        
        {/* Middle window */}
        <rect x="11.3" y="7" width="2.2" height="1.8" fill="rgba(255,255,255,0.5)" rx="0.2"/>
        
        {/* Back window */}
        <rect x="13.7" y="7" width="1.8" height="1.8" fill="rgba(255,255,255,0.5)" rx="0.2"/>
        
        {/* Front bumper/headlights */}
        <rect x="8" y="6.3" width="0.4" height="0.4" fill="rgba(255,255,200,0.7)"/>
        <rect x="15.6" y="6.3" width="0.4" height="0.4" fill="rgba(255,255,200,0.7)"/>
        
        {/* Door line */}
        <line x1="11" y1="6.5" x2="11" y2="12.5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
      </svg>
    </div>
  )

  // Create route GeoJSON
  const routeGeoJSON = useMemo(() => {
    if (!focusedCar || !tripData?.trip?.route?.polyline) return null

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: tripData.trip.route.polyline.map((point: [number, number]) => [point[1], point[0]]),
      },
    }
  }, [focusedCar, tripData])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card shadow-inner">
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={{
          version: 8,
          sources: {
            tiles: {
              type: "raster",
              tiles: mapStyle === 'satellite' 
                ? ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]
                : ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: mapStyle === 'satellite' ? "Esri, Maxar, Earthstar Geographics" : "&copy; OpenStreetMap Contributors",
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "base",
              type: "raster",
              source: "tiles",
            },
          ],
        }}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        {/* Render car markers */}
        {carsWithLocation.map((car) => {
          // Skip rendering the focused car if we have trip data with current location
          if (focusedCar?.id === car.id && tripData?.currentLocation) {
            return null
          }

          const color = car.currentTrip ? "#a855f7" : "#f97316"

          return (
            <Marker
              key={car.id}
              longitude={car.position[1]}
              latitude={car.position[0]}
              anchor="center"
              pitchAlignment="map"
              rotationAlignment="map"
              onClick={async (e) => {
                e.originalEvent.stopPropagation()
                const activeTripId = (car as any)?.activeTripId
                if (activeTripId) {
                  const data = await refetchById(activeTripId)
                  if (!data) {
                    toast({
                      title: "Trip details unavailable",
                      description: "Couldn't load route for this car.",
                    })
                    return
                  }
                }
                setPopupInfo(car)
                onFocusCar(car.id)
              }}
            >
              <div 
                style={{ cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setHoveredCar(car)}
                onMouseLeave={() => setHoveredCar(null)}
              >
                <CarIcon bearing={car.bearing} color={color} />
                {hoveredCar?.id === car.id && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 bg-card text-card-foreground border border-border px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap mb-2 shadow-lg z-[1000]"
                    style={{
                      backdropFilter: 'blur(6px)',
                      backgroundColor: isDark ? '#0b0b0b' : 'var(--color-card)',
                      color: isDark ? '#fff' : 'var(--color-card-foreground)',
                      borderColor: isDark ? '#222' : 'var(--color-border)',
                    }}
                  >
                    <div className="font-mono text-sm mb-1">
                      {car.plateNumber}
                    </div>
                    {car.currentTrip && (
                      <div className="text-[10px] text-green-500 mt-1 pt-1 border-t border-border">
                        {car.currentTrip.originName ? `${car.currentTrip.originName} → ${car.currentTrip.destinationName}` : car.currentTrip.destinationName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Marker>
          )
        })}

        {/* Show popup as custom overlay anchored to position to avoid default white map popup chrome */}
        {popupInfo && (
          <Marker
            longitude={popupInfo.position[1]}
            latitude={popupInfo.position[0]}
            anchor="bottom"
            pitchAlignment="map"
            rotationAlignment="map"
          >
            <div
              className="relative translate-y-[-8px]"
              style={{ pointerEvents: "auto" }}
            >
              <MapPopupContent
                car={popupInfo}
                onZoomOut={handleZoomOut}
                onOpenBooking={() => setBookingDialogOpen(true)}
                isDark={isDark}
              />
            </div>
          </Marker>
        )}

        {/* Show trip route when focused */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}

        {/* Render waypoint markers with progress */}
        {focusedCar &&
          tripData?.trip?.waypointProgresses?.map((waypoint: WaypointProgressDto, index: number) => {
            const isPassed = waypoint.state === "DONE"
            const isArrived = waypoint.state === "ARRIVED"
            const isApproaching = waypoint.state === "APPROACHING"

            // Color based on state
            const color = isPassed ? "#22c55e" : isArrived ? "#eab308" : "#3b82f6"
return (
              <Marker
                key={`waypoint-${waypoint.waypointIndex}`}
                longitude={waypoint.longitude}
                latitude={waypoint.latitude}
                anchor="center"
                pitchAlignment="map"
                rotationAlignment="map"
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-full mb-2"
                    style={{ pointerEvents: "auto" }}
                  >
                    <div
                      className="p-1 min-w-[180px] bg-card text-card-foreground border border-border rounded-md shadow-lg"
                      style={{
                        backgroundColor: isDark ? '#0b0b0b' : 'var(--color-card)',
                        color: isDark ? '#fff' : 'var(--color-card-foreground)',
                        borderColor: isDark ? '#222' : 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" style={{ color }} />
                        <h3 className="font-bold text-sm">
                          {waypoint.waypointName || `Waypoint ${waypoint.waypointIndex + 1}`}
                        </h3>
                      </div>

                      <div className="text-xs space-y-2">
                        {isPassed ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-500 px-2 py-1 font-semibold uppercase text-[10px]">
                            Passed
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="font-mono font-bold">{formatDistance(waypoint.remainingDistance)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ cursor: "pointer" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill={color} stroke="white" strokeWidth="3"/>
                      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{waypoint.waypointIndex + 1}</text>
                    </svg>
                  </div>
                </div>
              </Marker>
            )
          })}

        {/* Show current location from trip data if available */}
        {focusedCar && tripData?.currentLocation && (
          <Marker
            longitude={tripData.currentLocation.longitude}
            latitude={tripData.currentLocation.latitude}
            anchor="center"
            pitchAlignment="map"
            rotationAlignment="map"
          >
            <div
              style={{
                backgroundColor: "#ef4444",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "3px solid white",
                boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.3)",
              }}
            />
          </Marker>
        )}
      </Map>

      {/* Floating controls */}
      <div className="absolute top-6 right-6 z-[1000] flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/70 backdrop-blur border-border shadow-md"
          onClick={() => setSearchOpen(true)}
          aria-label="Search cars"
        >
          <Search className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/70 backdrop-blur border-border shadow-md hover:bg-primary/10 hover:border-primary/50"
          onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
          title={mapStyle === 'street' ? 'Switch to Satellite View' : 'Switch to Street View'}
          aria-label="Toggle map style"
        >
          {mapStyle === 'street' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          )}
        </Button>
      </div>

      {/* Location warning button - only show if there are cars without location */}
      {carsWithoutLocation.length > 0 && (
        <div className="absolute top-6 left-6 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            className="bg-amber-500/10 backdrop-blur border-amber-500/30 text-amber-600 hover:bg-amber-500/20 shadow-md"
            onClick={() => setShowLocationWarning(true)}
          >
            <span className="mr-2">⚠️</span>
            {carsWithoutLocation.length} car{carsWithoutLocation.length > 1 ? "s" : ""} hidden
          </Button>
        </div>
      )}

      {/* Cars visible counter - bottom left */}
      {carsWithLocation.length > 0 && (
        <div className="absolute bottom-6 left-6 z-[1000]">
          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground font-medium">
              {focusedCar ? (
                <>
                  Viewing <span className="font-bold text-primary">1</span> car
                </>
              ) : (
                <>
                  Showing <span className="font-bold text-primary">{carsWithLocation.length}</span> car
                  {carsWithLocation.length > 1 ? "s" : ""} on map
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Search dialog listing plate numbers */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} className="max-w-sm">
        <CommandInput placeholder="Search plate number..." />
        <CommandList>
          <CommandEmpty>No cars found.</CommandEmpty>
          <CommandGroup heading="Cars">
            {carsWithLocation.map((car) => (
              <CommandItem
                key={car.id}
                onSelect={() => {
                  onFocusCar(car.id)
                  setSearchOpen(false)
                }}
              >
                {car.plateNumber}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Location warning dialog */}
      <Dialog open={showLocationWarning} onOpenChange={setShowLocationWarning}>
        <DialogContent className="sm:max-w-[500px] bg-card border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <span className="text-2xl">⚠️</span>
              Cars Without Location Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              The following cars don't have location data and cannot be displayed on the map. Exit map mode to view
              and manage these vehicles.
            </p>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-lg p-3 bg-muted/30">
              {carsWithoutLocation.map((car) => (
                <div
                  key={car.id}
                  className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                >
                  <div>
                    <p className="font-bold font-mono">{car.plateNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">Status: {car.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-600 font-medium">No location</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowLocationWarning(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      

      {/* Booking Details Dialog */}
      {focusedCar?.currentTrip && (
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[80vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-500" />
                Trip Bookings - {focusedCar.plateNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {snapshotLoading && (
                <SkeletonBookingSummary />
              )}

              {snapshotError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{snapshotError}</p>
                </div>
              )}

              {!snapshotLoading && !snapshotError && snapshot && (
                <>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Trip Destination</p>
                    <p className="text-lg font-bold">{focusedCar.currentTrip.destinationName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{focusedCar.currentTrip.distanceKm} km</p>
                  </div>

                  {/* Capacity Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Seats</p>
                      <p className="text-2xl font-bold text-emerald-500">{snapshot.capacity.totalSeats}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupied Seats</p>
                      <p className="text-2xl font-bold text-blue-500">{snapshot.capacity.occupiedSeats}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Available</p>
                      <p className="text-2xl font-bold text-green-500">{snapshot.capacity.availableSeats}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pending Payment</p>
                      <p className="text-2xl font-bold text-amber-500">{snapshot.capacity.pendingPaymentSeats}</p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Amount Paid</p>
                      <p className="text-2xl font-bold text-emerald-500">{snapshot.capacity.totalAmountPaid.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pending Amount</p>
                      <p className="text-2xl font-bold text-red-500">{snapshot.capacity.totalAmountPending.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Trip Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-3">Trip Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Tickets</p>
                        <p className="text-lg font-bold">{snapshot.summary.totalTickets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid Tickets</p>
                        <p className="text-lg font-bold text-green-500">{snapshot.summary.paidTickets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pending Payments</p>
                        <p className="text-lg font-bold text-amber-500">{snapshot.summary.pendingPayments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completed Dropoffs</p>
                        <p className="text-lg font-bold text-blue-500">{snapshot.summary.completedDropoffs}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Locations</p>
                    {snapshot.locations.map((location, idx, arr) => {
                      const isLastDestination = location.type === 'DESTINATION' && idx === arr.length - 1
                      return (
                      <div
                        key={`${location.locationId}-${idx}`}
                        className="p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                location.type === "ORIGIN" ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-semibold">
                                {getLocationName(location.locationId, location.type, location.order)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {location.type === "ORIGIN" ? "Origin" : isLastDestination ? "Destination" : `Stop ${location.order}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                          {/* Financial Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Pending Amount</p>
                              <p className="text-sm font-bold text-red-500">{location.seats.totalAmountPending.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid Amount</p>
                              <p className="text-sm font-bold text-emerald-500">{location.seats.totalAmountPaid.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {/* Seats Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Pending Seats</p>
                              <p className="text-sm font-bold text-amber-500">{location.seats.pendingPayment}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid Seats</p>
                              <p className="text-sm font-bold text-green-500">{location.seats.pickup}</p>
                            </div>
                          </div>

                          {/* Pickup/Dropoff Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Pickup Seats</p>
                              <p className="text-sm font-bold text-blue-500">{location.seats.pickup}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Dropoff Seats</p>
                              <p className="text-sm font-bold text-purple-500">{location.seats.dropoff}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>

                  {/* Occupancy Rate */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupancy Rate</p>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{
                          width: `${(snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm font-bold mt-2">
                      {Math.round((snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100)}%
                    </p>
                  </div>
                </>
              )}

              {!snapshotLoading && !snapshotError && !snapshot && (
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">No booking data available</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
