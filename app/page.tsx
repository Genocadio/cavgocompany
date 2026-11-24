"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { type Car } from "@/lib/data"
import MapView from "@/components/map-view"
import CarManagement from "@/components/car-management"
import AppHeader from "@/components/app-header"
import CarDetails from "@/components/car-details"
import TripDetailsDialog from "@/components/trip-details-dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { LayoutDashboard, MapIcon, ChevronRight, LogOut, Clock3, Moon, Sun } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CarIcon from "@/components/car-icon" // Declare CarIcon here
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCompanyCars, type CarWithTripId } from "@/hooks/use-company-cars"
import { useTripDetails } from "@/hooks/use-trip-details"
import { useToast } from "@/hooks/use-toast"
import { useActiveCompanyTrips } from "@/hooks/use-active-company-trips"
import {
  applyLiveTripsToCars,
  applyTripOverrides,
  type TripViewOverride,
} from "@/hooks/use-trip-subscriptions-manager"
import { formatSpeed, reverseGeocode } from "@/lib/utils"
import { navigationUnavailableNotice } from "@/lib/trip-availability"

export default function FleetDashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const companyId = user?.companyId
  const { cars: fetchedCars, isLoading: carsLoading, refetch: refetchCars } = useCompanyCars({
    companyId,
    limit: 50,
    offset: 0,
  })
  
  // Company-wide live trips: the backend pushes every active trip (including
  // ones started after the last carsByCompany fetch) and removes ended ones.
  const { trips: liveTrips, isReady: liveTripsReady } = useActiveCompanyTrips(companyId)

  // Single authoritative car list: fetched cars + live trip overlay.
  const cars = useMemo(
    () => applyLiveTripsToCars(fetchedCars, liveTrips, liveTripsReady),
    [fetchedCars, liveTrips, liveTripsReady]
  )

  // One override map for focused-map polling and the trip dialog. Keeping all
  // refinements here (keyed by trip id) prevents the previous race where several
  // independent `setCarsView` writers overwrote each other.
  const [tripOverrides, setTripOverrides] = useState<Map<string, TripViewOverride>>(new Map())
  const carsView = useMemo(
    () => applyTripOverrides(cars, tripOverrides),
    [cars, tripOverrides]
  )

  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [mapFocusId, setMapFocusId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("management")
  const [viewingCarDetails, setViewingCarDetails] = useState<Car | null>(null)
  const [viewingTripCar, setViewingTripCar] = useState<Car | null>(null)
  const [viewingTrip, setViewingTrip] = useState<Car["currentTrip"] | null>(null)
  const [speedLocation, setSpeedLocation] = useState<string | null>(null)
  const [isLoadingSpeedLocation, setIsLoadingSpeedLocation] = useState(false)
  const speedHoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedSpeedLocationRef = useRef(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { refetchById: fetchTripById } = useTripDetails({ tripId: undefined, enabled: false })

  // Convert a REST/GraphQL trip payload into a single override entry. Only
  // fields that exist on the view model are kept; `...car.currentTrip` is never
  // spread last here, so fresh values always win.
  const tripDataToOverride = useCallback((tripData: any): TripViewOverride | null => {
    if (!tripData?.id) return null
    const destinations: any[] = tripData.destinations ?? []
    const finalDestination = destinations[destinations.length - 1]
    const override: TripViewOverride = {
      id: tripData.id,
      ...(tripData.status ? { status: tripData.status } : {}),
      ...(tripData.createdAt ? { createdAt: tripData.createdAt } : {}),
      ...(tripData.totalDistance
        ? { totalDistanceKm: Math.round((tripData.totalDistance / 1000) * 10) / 10 }
        : {}),
      ...(tripData.origin?.addres ? { originName: tripData.origin.addres } : {}),
      ...(finalDestination?.addres ? { destinationName: finalDestination.addres } : {}),
    }
    if (destinations.length) {
      override.destinations = destinations.map((d) => ({
        id: String(d.id ?? Math.random().toString(36).slice(2)),
        addres: d.addres,
        remainingDistance: d.remainingDistance,
        isPassed: d.isPassed === true || d.isPassed === "true",
        index: d.index,
      }))
      override.nextStopName = destinations.find((d) => !(d.isPassed === true || d.isPassed === "true"))?.addres
        || finalDestination?.addres
    }
    return override
  }, [])

  const setTripOverride = useCallback((override: TripViewOverride) => {
    setTripOverrides((prev) => {
      const next = new Map(prev)
      next.set(String(override.id), { ...next.get(String(override.id)), ...override })
      return next
    })
  }, [])

  // Handler for focused car trip updates from MapView polling
  const handleFocusedCarTripUpdate = useCallback((_carId: string, tripData: any) => {
    const override = tripDataToOverride(tripData)
    if (override) setTripOverride(override)
  }, [tripDataToOverride, setTripOverride])

  // Silent background polling every minute. It must NOT pause when a car is
  // focused or a trip dialog is open — those states used to freeze car speed,
  // position and trip status until the user closed the overlay.
  useEffect(() => {
    if (!companyId) return

    refetchCars().catch((err) => console.error('[FleetDashboard] background refetch error', err))

    const interval = setInterval(() => {
      refetchCars().catch((err) => console.error('[FleetDashboard] background refetch error', err))
    }, 60000)

    return () => clearInterval(interval)
  }, [companyId, refetchCars])

  // Handler to update car's trip data when the trip dialog subscription receives new data
  const handleTripUpdate = useCallback((tripData: any) => {
    const override = tripDataToOverride(tripData)
    if (!override) return

    // Keep the open dialog's trip in sync without closing over a stale `viewingTripCar`.
    setViewingTripCar((prev) =>
      prev && String(prev.currentTrip?.id) === String(tripData.id)
        ? { ...prev, currentTrip: { ...prev.currentTrip, ...override } as NonNullable<Car["currentTrip"]> }
        : prev
    )
    setViewingTrip((prev) =>
      prev && String(prev.id) === String(tripData.id)
        ? { ...prev, ...override }
        : prev
    )

    // Feed the same override into the authoritative car list.
    setTripOverride(override)
  }, [tripDataToOverride, setTripOverride])

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleView = () => {
    setActiveTab((prev) => {
      const newTab = prev === "management" ? "map" : "management"
      // Clear focused car when leaving map view (going to management)
      if (newTab === "management") {
        setMapFocusId(undefined)
      }
      return newTab
    })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleFocusFromMap = (id: string | undefined) => {
    setMapFocusId(id)
  }

  const handleViewOnMap = async (car: Car) => {
    const hasLocation = !!car.position && car.position[0] !== 0 && car.position[1] !== 0
    const activeTripId = (car as unknown as CarWithTripId)?.activeTripId
    const hasActiveTrip = !!car.currentTrip || !!activeTripId

    if (!hasLocation && !hasActiveTrip) {
      toast({
        title: "Cannot view on map",
        description: "No location or active trip available for this car.",
      })
      return
    }

    // If only location exists, go straight to map
    if (hasLocation && !hasActiveTrip) {
      setMapFocusId(car.id)
      setActiveTab("map")
      return
    }

    // If only active trip exists (no location), fetch trip first; if fails, do not navigate
    if (!hasLocation && hasActiveTrip && activeTripId) {
      const data = await fetchTripById(activeTripId)
      if (!data) {
        toast(navigationUnavailableNotice(car.currentTrip?.status))
        return
      }
      setMapFocusId(car.id)
      setActiveTab("map")
      return
    }

    // If both exist, try to fetch; a scheduled trip is legitimately absent from
    // Navigation, so still show the car and explain why there is no route.
    if (hasLocation && hasActiveTrip && activeTripId) {
      const data = await fetchTripById(activeTripId)
      if (!data) {
        toast(navigationUnavailableNotice(car.currentTrip?.status))
      }
      setMapFocusId(car.id)
      setActiveTab("map")
    }
  }

  const handleViewDetails = (car: Car) => {
    setViewingCarDetails(car)
  }

  const handleViewTrip = (car: Car, trip: Car["currentTrip"]) => {
    if (trip) {
      setViewingTripCar(car)
      setViewingTrip(trip)
    }
  }

  const handleViewTripOnMap = async (car: Car) => {
    // Fetch trip details first, same as handleViewOnMap
    const activeTripId = (car as unknown as CarWithTripId)?.activeTripId
    
    if (!activeTripId) {
      toast({
        title: "No active trip",
        description: "This car doesn't have an active trip.",
      })
      return
    }

    // Fetch trip details. A 404 simply means Navigation has not seen this trip
    // yet; if the car has a live position the map is still useful.
    const data = await fetchTripById(activeTripId)
    const hasLocation = !!car.position && car.position[0] !== 0 && car.position[1] !== 0
    if (!data && !hasLocation) {
      toast(navigationUnavailableNotice(car.currentTrip?.status))
      return
    }
    if (!data) {
      toast(navigationUnavailableNotice(car.currentTrip?.status))
    }

    setViewingTrip(null)
    setViewingTripCar(null)
    setMapFocusId(car.id)
    setActiveTab("map")
  }

  const getUserInitials = () => {
    if (!user?.username) return "U"
    const parts = user.username.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return user.username.slice(0, 2).toUpperCase()
  }

  // Show loading state while checking authentication
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user.companyId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Company access required</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but it does not have an active Cavgo company membership.
            Ask your company administrator to add or approve your account.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-screen w-full bg-background flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader activeTab={activeTab} onToggleView={toggleView} showViewSwitcher={true} />

        <div className="flex-1 overflow-hidden relative">
          {viewingCarDetails ? (
            <CarDetails car={viewingCarDetails} onBack={() => setViewingCarDetails(null)} />
          ) : (
            <Tabs value={activeTab} className="h-full">
              <TabsContent value="management" className="m-0 h-full">
                <CarManagement
                  cars={carsView}
                  onSelectCar={(car) => setSelectedCar(car)}
                  onViewOnMap={handleViewOnMap}
                  onViewDetails={handleViewDetails}
                  onViewTrip={handleViewTrip}
                />
              </TabsContent>

              <TabsContent value="map" className="m-0 h-full p-4">
                <MapView
                  cars={carsView}
                  focusedCarId={mapFocusId}
                  onFocusCar={handleFocusFromMap}
                  onFocusedCarTripUpdate={handleFocusedCarTripUpdate}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Detail Overlay */}
      <Dialog open={!!selectedCar} onOpenChange={() => setSelectedCar(null)}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CarIcon className="text-primary" />
              </div>
              {selectedCar?.plateNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status</p>
              <p className="text-lg font-semibold capitalize">{selectedCar?.status}</p>
            </div>
            <div 
              className="p-4 bg-muted/50 rounded-xl border border-border"
              onMouseEnter={() => {
                if (!selectedCar?.position || hasLoadedSpeedLocationRef.current) return
                speedHoverTimerRef.current = setTimeout(async () => {
                  setIsLoadingSpeedLocation(true)
                  const locationName = await reverseGeocode(selectedCar.position[0], selectedCar.position[1])
                  setSpeedLocation(locationName)
                  setIsLoadingSpeedLocation(false)
                  hasLoadedSpeedLocationRef.current = true
                }, 3000)
              }}
              onMouseLeave={() => {
                if (speedHoverTimerRef.current) {
                  clearTimeout(speedHoverTimerRef.current)
                  speedHoverTimerRef.current = null
                }
              }}
            >
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Live Speed</p>
              <p className="text-lg font-semibold">{selectedCar ? formatSpeed(selectedCar.speed) : 0} km/h</p>
              {(isLoadingSpeedLocation || speedLocation) && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {isLoadingSpeedLocation ? "Loading location..." : speedLocation}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 px-1">Trip History</h3>
            <div className="space-y-2">
              {selectedCar?.tripHistory.length ? (
                selectedCar.tripHistory.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 bg-secondary/30 rounded-lg border border-border flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{trip.destinationName}</p>
                      <p className="text-xs text-muted-foreground">{trip.distanceKm} km trip • Completed</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-center py-8 text-muted-foreground bg-secondary/20 rounded-lg">
                  No previous trips recorded
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-end gap-3">
            <button
              onClick={() => setSelectedCar(null)}
              className="px-4 py-2 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80"
            >
              Close
            </button>
            <button
              disabled={
                selectedCar ? (!selectedCar.position || selectedCar.position[0] === 0 || selectedCar.position[1] === 0) && !selectedCar.currentTrip : false
              }
              onClick={async () => {
                if (selectedCar) {
                  await handleViewOnMap(selectedCar)
                  setSelectedCar(null)
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              View on Map
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trip Details Dialog */}
      <TripDetailsDialog
        open={!!viewingTrip && !!viewingTripCar}
        onOpenChange={(open) => {
          if (!open) {
            setViewingTrip(null)
            setViewingTripCar(null)
          }
        }}
        car={viewingTripCar || undefined}
        onViewTripOnMap={handleViewTripOnMap}
        onTripUpdate={handleTripUpdate}
      />
    </main>
  )
}