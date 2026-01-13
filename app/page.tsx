"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { useTripSubscriptionsManager } from "@/hooks/use-trip-subscriptions-manager"
import { formatSpeed, reverseGeocode } from "@/lib/utils"

export default function FleetDashboard() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const { cars: fetchedCars, isLoading: carsLoading, refetch: refetchCars } = useCompanyCars({
    companyId: user?.companyId ?? undefined,
    limit: 50,
    offset: 0,
  })
  
  // Apply real-time trip subscriptions
  const cars = useTripSubscriptionsManager(fetchedCars)
  const [carsView, setCarsView] = useState<Car[]>(cars)
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

  // Keep displayed cars in sync with subscription manager output
  useEffect(() => {
    setCarsView(cars)
  }, [cars])

  // Handler for focused car trip updates from MapView polling
  const handleFocusedCarTripUpdate = useCallback((carId: string, tripData: any) => {
    setCarsView((prev) =>
      prev.map((car) => {
        if (car.id !== carId || !car.currentTrip || String(car.currentTrip.id) !== String(tripData.id)) {
          return car
        }
        // Silently update focused car's trip data from polling
        return {
          ...car,
          currentTrip: {
            id: tripData.id,
            status: tripData.status,
            totalDistance: tripData.totalDistance,
            createdAt: tripData.createdAt,
            origin: tripData.origin,
            destinations: tripData.destinations,
            originName: tripData.origin?.addres || car.currentTrip.originName,
            destinationName: tripData.destinations?.[tripData.destinations.length - 1]?.addres || car.currentTrip.destinationName,
            ...car.currentTrip,
          }
        }
      })
    )
  }, [])

  // Silent background polling every minute; pause when a car is focused or a trip dialog is open
  const pollingPaused = !!mapFocusId || (!!viewingTrip && !!viewingTripCar)
  useEffect(() => {
    if (pollingPaused) return

    // Initial refresh on resume
    refetchCars().catch((err) => console.error('[FleetDashboard] background refetch error', err))

    const interval = setInterval(() => {
      refetchCars().catch((err) => console.error('[FleetDashboard] background refetch error', err))
    }, 60000)

    return () => clearInterval(interval)
  }, [pollingPaused, refetchCars])

  // Handler to update car's trip data when subscription receives new data
  const handleTripUpdate = useCallback((tripData: any) => {
    // Update viewing trip car if it matches - completely replace currentTrip
    if (viewingTripCar && String(viewingTripCar.currentTrip?.id) === String(tripData.id)) {
      const updatedCar = {
        ...viewingTripCar,
        currentTrip: {
          id: tripData.id,
          status: tripData.status,
          totalDistance: tripData.totalDistance,
          createdAt: tripData.createdAt,
          updatedAt: tripData.updatedAt,
          origin: tripData.origin,
          destinations: tripData.destinations,
          originName: tripData.origin?.addres || '',
          destinationName: tripData.destinations?.[tripData.destinations.length - 1]?.addres || '',
        }
      }
      setViewingTripCar(updatedCar)
    }

    // Also update the cars list so badges and cards stay fresh
    setCarsView((prev) =>
      prev.map((car) => {
        if (!car.currentTrip || String(car.currentTrip.id) !== String(tripData.id)) return car

        return {
          ...car,
          currentTrip: {
            id: tripData.id,
            status: tripData.status,
            totalDistance: tripData.totalDistance,
            createdAt: tripData.createdAt,
            updatedAt: tripData.updatedAt,
            origin: tripData.origin,
            destinations: tripData.destinations,
            originName: tripData.origin?.addres || '',
            destinationName: tripData.destinations?.[tripData.destinations.length - 1]?.addres || '',
          }
        }
      })
    )
  }, [viewingTripCar])

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
        toast({ title: "Trip details unavailable", description: "Couldn’t fetch trip details for this car." })
        return
      }
      setMapFocusId(car.id)
      setActiveTab("map")
      return
    }

    // If both exist, try to fetch; if it fails, still navigate and show location
    if (hasLocation && hasActiveTrip && activeTripId) {
      const data = await fetchTripById(activeTripId)
      if (!data) {
        toast({ title: "Trip details unavailable", description: "Showing live location; route could not be loaded." })
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

    // Fetch trip details
    const data = await fetchTripById(activeTripId)
    if (!data) {
      toast({
        title: "Trip details unavailable",
        description: "Couldn't fetch trip details for this car.",
      })
      return
    }

    // Only navigate if fetch succeeds
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
  if (authLoading) {
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
                  cars={carsView}
                  focusedCarId={mapFocusId}
                  onFocusCar={handleFocusFromMap}
                  onFocusedCarTripUpdate={handleFocusedCarTripUpdate}
               
      </div>
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
                <MapView cars={carsView} focusedCarId={mapFocusId} onFocusCar={handleFocusFromMap} />
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