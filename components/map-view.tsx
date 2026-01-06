"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useMemo } from "react"
import type { Car } from "@/lib/data"
import type { WaypointProgressDto } from "@/types"
import { Card } from "@/components/ui/card"
import { Navigation, Search, Ticket, Map, Maximize2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTripDetails } from "@/hooks/use-trip-details"
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

// Import CSS normally
import "leaflet/dist/leaflet.css"

// to ensure they only initialize when the window is ready.
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
})
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

// Custom hook to handle map operations
const MapController = ({ position, L }: { position: [number, number]; L: any }) => {
  const [map, setMap] = useState<any>(null)

  // Use a client-only dynamic import for useMap inside a sub-component
  const MapUser = dynamic(
    () =>
      import("react-leaflet").then((mod) => {
        const Inner = () => {
          const mapInstance = mod.useMap()
          useEffect(() => {
            if (mapInstance && position) {
              mapInstance.setView(position, 15)
            }
          }, [mapInstance, position])
          return null
        }
        return Inner
      }),
    { ssr: false },
  )

  return <MapUser />
}

// Fit all cars into view when no car is focused
const FitAllController = ({ positions }: { positions: [number, number][] }) => {
  const FitUser = dynamic(
    () =>
      import("react-leaflet").then((mod) => {
        const Inner = () => {
          const mapInstance = mod.useMap()
          useEffect(() => {
            if (mapInstance && positions?.length) {
              // Fit bounds to all car positions with padding
              mapInstance.fitBounds(positions as any, { padding: [64, 64], maxZoom: 14 })
              // Close all popups when viewing all cars
              mapInstance.closePopup()
            }
          }, [mapInstance, positions])
          return null
        }
        return Inner
      }),
    { ssr: false },
  )
  return <FitUser />
}

export default function MapView({
  cars,
  focusedCarId,
  onFocusCar,
}: {
  cars: Car[]
  focusedCarId?: string
  onFocusCar: (id: string | undefined) => void
}) {
  const [L, setL] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [showLocationWarning, setShowLocationWarning] = useState(false)

  // Filter cars with and without location
  const carsWithLocation = useMemo(() => 
    cars.filter(car => car.position && car.position[0] !== 0 && car.position[1] !== 0),
    [cars]
  )
  
  const carsWithoutLocation = useMemo(() => 
    cars.filter(car => !car.position || car.position[0] === 0 || car.position[1] === 0),
    [cars]
  )

  const focusedCar = useMemo(() => carsWithLocation.find((c) => c.id === focusedCarId), [carsWithLocation, focusedCarId])
  
  // Fetch trip details for focused car if it has a trip
  const { tripData, isLoading: tripLoading } = useTripDetails({
    tripId: focusedCar?.activeTripId,
    enabled: !!focusedCar && !!focusedCar.activeTripId,
    pollInterval: 60000, // 1 minute
  })

  // by using a lazy import that only triggers on the client.
  useEffect(() => {
    setIsClient(true)
    const initLeaflet = async () => {
      try {
        const leaflet = await import("leaflet")
        // Fix for default markers not loading correctly in some environments
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        })
        setL(leaflet)
      } catch (e) {
        console.error("[v0] Leaflet initialization failed:", e)
      }
    }
    initLeaflet()
  }, [])

  const displayCars = useMemo(() => (focusedCar ? [focusedCar] : carsWithLocation), [focusedCar, carsWithLocation])

  // Kigali, Rwanda coordinates as default center
  const KIGALI_CENTER: [number, number] = [-1.9536, 30.0606]
  const defaultCenter = useMemo(() => {
    if (focusedCar?.position) return focusedCar.position
    if (carsWithLocation.length > 0) return carsWithLocation[0].position
    return KIGALI_CENTER
  }, [focusedCar, carsWithLocation])

  // Close dialogs when exiting focus
  useEffect(() => {
    if (!focusedCar) {
      setBookingDialogOpen(false)
    }
  }, [focusedCar])

  // Helper to format time ago from ISO timestamp
  const formatTimeAgo = (isoTimestamp?: string | null) => {
    if (!isoTimestamp) return null
    try {
      const date = new Date(isoTimestamp)
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

  // Custom icon for cars
  const carIcon = (bearing: number, color = "#3b82f6") => {
    if (!L) return null
    return L.divIcon({
      html: `<div style="transform: rotate(${bearing}deg); color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
    </div>`,
      className: "custom-div-icon",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  if (!isClient || !L) {
    return (
      <div className="w-full h-full bg-muted/20 flex items-center justify-center rounded-xl border-2 border-dashed border-border">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold tracking-tight text-muted-foreground uppercase">Syncing Fleet Satellite...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {displayCars.map((car) => {
          const icon = carIcon(car.bearing, car.currentTrip ? "#ef4444" : "#f59e0b")
          if (!icon) return null

          return (
            <div key={car.id}>
              <Marker
                position={car.position}
                icon={icon}
                eventHandlers={{
                  click: () => onFocusCar(car.id),
                }}
              >
                <Popup className="dark-popup">
                  <div className="p-2 min-w-[150px]">
                    <h3 className="font-bold text-lg leading-none mb-1">{car.plateNumber}</h3>
                    <div className="flex justify-between text-xs mt-2 border-t pt-2 border-border/50">
                      <span className="text-muted-foreground uppercase font-bold tracking-tighter">Speed</span>
                      <span className="font-mono">{car.speed} km/h</span>
                    </div>
                    {car.currentTrip && (
                      <div className="mt-3 bg-red-500/10 p-2 rounded border border-red-500/20">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                          Active Trip
                        </p>
                        <p className="text-xs font-medium truncate opacity-90">{car.currentTrip.destinationName}</p>
                        <p className="text-xs font-bold mt-1 text-red-400">{car.currentTrip.distanceKm} km remaining</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Show trip route when this car is focused and has trip data from API */}
              {focusedCar?.id === car.id && tripData?.trip && (
                <>
                  {/* Render route polyline if available */}
                  {tripData.trip.route?.polyline && (
                    <Polyline
                      positions={tripData.trip.route.polyline}
                      color="#3b82f6"
                      weight={4}
                      opacity={0.7}
                    />
                  )}

                  {/* Render waypoint markers with progress */}
                  {tripData.trip.waypointProgresses?.map((waypoint: WaypointProgressDto, index) => {
                    const position: [number, number] = [waypoint.latitude, waypoint.longitude]
                    const isPassed = waypoint.state === 'DONE'
                    const isArrived = waypoint.state === 'ARRIVED'
                    const isApproaching = waypoint.state === 'APPROACHING'

                    // Color based on state
                    const color = isPassed ? '#22c55e' : isArrived ? '#eab308' : '#3b82f6'
                    
                    return (
                      <Marker
                        key={`waypoint-${waypoint.waypointIndex}`}
                        position={position}
                        icon={L.divIcon({
                          html: `
                            <div style="
                              background-color: ${color}; 
                              width: 24px; 
                              height: 24px; 
                              border-radius: 50%; 
                              border: 3px solid white; 
                              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-weight: bold;
                              font-size: 11px;
                              color: white;
                            ">
                              ${waypoint.waypointIndex + 1}
                            </div>
                          `,
                          className: "",
                          iconSize: [24, 24],
                          iconAnchor: [12, 12],
                        })}
                      >
                        <Popup>
                          <div className="p-2 min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4" style={{ color }} />
                              <h3 className="font-bold text-sm">
                                {waypoint.waypointName || `Waypoint ${waypoint.waypointIndex + 1}`}
                              </h3>
                            </div>
                            
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="font-semibold capitalize" style={{ color }}>
                                  {waypoint.state.toLowerCase()}
                                </span>
                              </div>

                              {isPassed && waypoint.arrivedAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Passed:</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-mono">{formatTimeAgo(waypoint.arrivedAt)}</span>
                                  </div>
                                </div>
                              )}

                              {isArrived && waypoint.arrivedAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Arrived:</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-mono">{formatTimeAgo(waypoint.arrivedAt)}</span>
                                  </div>
                                </div>
                              )}

                              {isApproaching && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Distance:</span>
                                    <span className="font-mono font-bold">
                                      {formatDistance(waypoint.remainingDistance)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">ETA:</span>
                                    <span className="font-mono">
                                      {Math.round(waypoint.remainingTime / 60)} min
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {waypoint.waypointId && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <span className="text-[10px] text-muted-foreground">ID: {waypoint.waypointId}</span>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}

                  {/* Show current location from trip data if available */}
                  {tripData.currentLocation && (
                    <Marker
                      position={[tripData.currentLocation.latitude, tripData.currentLocation.longitude]}
                      icon={L.divIcon({
                        html: `
                          <div style="
                            background-color: #ef4444; 
                            width: 16px; 
                            height: 16px; 
                            border-radius: 50%; 
                            border: 3px solid white; 
                            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
                            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                          "></div>
                        `,
                        className: "",
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                      })}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold text-red-500">Current Position</p>
                          <p className="text-muted-foreground">
                            Speed: {tripData.currentLocation.speed.toFixed(1)} m/s
                          </p>
                          {tripData.currentLocation.heading && (
                            <p className="text-muted-foreground">
                              Heading: {tripData.currentLocation.heading.toFixed(0)}°
                            </p>
                          )}
                          <p className="text-muted-foreground text-[10px] mt-1">
                            {formatTimeAgo(tripData.currentLocation.timestamp)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              )}
            </div>
          )
        })}
        {focusedCar ? (
          <MapController position={focusedCar.position} L={L} />
        ) : carsWithLocation.length > 0 ? (
          <FitAllController positions={carsWithLocation.map((c) => c.position)} />
        ) : null}
      </MapContainer>

      {/* Floating controls */}
      <div className="absolute top-6 right-6 z-[1000] flex gap-2">
        {/* View All button - only show when a car is focused or there are multiple cars */}
        {(focusedCar || carsWithLocation.length > 1) && (
          <Button
            variant="outline"
            size="icon"
            className="bg-card/70 backdrop-blur border-border shadow-md hover:bg-primary/10 hover:border-primary/50"
            onClick={() => onFocusCar(undefined)}
            title={focusedCar ? "View all cars" : `View all ${carsWithLocation.length} cars on map`}
            aria-label="View all cars"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="bg-card/70 backdrop-blur border-border shadow-md"
          onClick={() => setSearchOpen(true)}
          aria-label="Search cars"
        >
          <Search className="w-5 h-5" />
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
            {carsWithoutLocation.length} car{carsWithoutLocation.length > 1 ? 's' : ''} hidden
          </Button>
        </div>
      )}

      {/* Cars visible counter - bottom left */}
      {carsWithLocation.length > 0 && (
        <div className="absolute bottom-6 left-6 z-[1000]">
          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground font-medium">
              {focusedCar ? (
                <>Viewing <span className="font-bold text-primary">1</span> car</>
              ) : (
                <>
                  Showing <span className="font-bold text-primary">{carsWithLocation.length}</span> car{carsWithLocation.length > 1 ? 's' : ''} on map
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
              The following cars don't have location data and cannot be displayed on the map. 
              Exit map mode to view and manage these vehicles.
            </p>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-lg p-3 bg-muted/30">
              {carsWithoutLocation.map((car) => (
                <div 
                  key={car.id} 
                  className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                >
                  <div>
                    <p className="font-bold font-mono">{car.plateNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {car.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-600 font-medium">No location</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowLocationWarning(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Focus Overlay UI */}
      {focusedCar && (
        <div className="absolute bottom-6 right-6 z-[1000]">
          <Card className="p-3 bg-background/90 backdrop-blur-xl border-primary/50 shadow-2xl">
            <div className="flex flex-col gap-2">
              <p className="font-bold text-lg tracking-tight text-center">{focusedCar.plateNumber}</p>
              <div className="flex items-center justify-center gap-2">
                {focusedCar.currentTrip && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBookingDialogOpen(true)}
                    className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-2"
                    title="View trip bookings"
                  >
                    <span className="text-sm font-bold">{focusedCar.currentTrip.bookedSeats}</span>
                    <Ticket className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold">{focusedCar.currentTrip.totalSeats}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onFocusCar(undefined)}
                  className="bg-primary/10 border-primary/20 hover:bg-primary/20"
                  title="Exit focus"
                >
                  <Map className="w-4 h-4 text-primary" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Booking Details Dialog */}
      {focusedCar?.currentTrip && (
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-500" />
                Trip Bookings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Trip Destination</p>
                <p className="text-lg font-bold">{focusedCar.currentTrip.destinationName}</p>
                <p className="text-xs text-muted-foreground mt-1">{focusedCar.currentTrip.distanceKm} km</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Seats</p>
                  <p className="text-2xl font-bold text-primary">{focusedCar.currentTrip.totalSeats}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Booked Seats</p>
                  <p className="text-2xl font-bold text-green-500">{focusedCar.currentTrip.bookedSeats}</p>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Remaining Seats</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {focusedCar.currentTrip.totalSeats - focusedCar.currentTrip.bookedSeats}
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {focusedCar.currentTrip.currency || "USD"} {focusedCar.currentTrip.totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupancy Rate</p>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{
                      width: `${
                        (focusedCar.currentTrip.bookedSeats / focusedCar.currentTrip.totalSeats) * 100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-sm font-bold mt-2">
                  {Math.round(
                    (focusedCar.currentTrip.bookedSeats / focusedCar.currentTrip.totalSeats) * 100
                  )}%
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
