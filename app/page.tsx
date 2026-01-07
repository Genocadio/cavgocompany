"use client"

import { useState, useEffect, useCallback } from "react"
import { Spinner } from "@/components/ui/spinner"
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

export default function FleetDashboard() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const { cars: fetchedCars, isLoading: carsLoading } = useCompanyCars({
    companyId: user?.companyId ?? undefined,
    limit: 50,
    offset: 0,
  })
  
  // Apply real-time trip subscriptions
  const cars = useTripSubscriptionsManager(fetchedCars)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [mapFocusId, setMapFocusId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("management")
  const [viewingCarDetails, setViewingCarDetails] = useState<Car | null>(null)
  const [viewingTripCar, setViewingTripCar] = useState<Car | null>(null)
  const [viewingTrip, setViewingTrip] = useState<Car["currentTrip"] | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { refetchById: fetchTripById } = useTripDetails({ tripId: undefined, enabled: false })

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleView = () => {
    setActiveTab((prev) => (prev === "management" ? "map" : "management"))
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

  const handleViewTripOnMap = (car: Car) => {
    // Close the trip dialog
    setViewingTrip(null)
    setViewingTripCar(null)
    // Focus on the car and switch to map view
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
        <div className="text-center">
          <Spinner className="w-10 h-10 text-primary inline-block mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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
                  cars={cars}
                  onSelectCar={(car) => setSelectedCar(car)}
                  onViewOnMap={handleViewOnMap}
                  onViewDetails={handleViewDetails}
                  onViewTrip={handleViewTrip}
                />
              </TabsContent>

              <TabsContent value="map" className="m-0 h-full p-4">
                <MapView cars={cars} focusedCarId={mapFocusId} onFocusCar={handleFocusFromMap} />
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
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Live Speed</p>
              <p className="text-lg font-semibold">{selectedCar?.speed} km/h</p>
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
      />
    </main>
  )
}