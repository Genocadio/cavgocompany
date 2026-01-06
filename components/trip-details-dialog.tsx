"use client"

import type { Car } from "@/lib/data"
import type { WaypointProgressDto } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Navigation, Clock, Loader2, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTripDetails } from "@/hooks/use-trip-details"

export default function TripDetailsDialog({
  open,
  onOpenChange,
  car,
  onViewTripOnMap,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  car?: Car
  onViewTripOnMap?: (car: Car) => void
}) {
  // Don't fetch full trip details on dialog open - use subscription data from car.currentTrip
  // Full details will be fetched only when viewing on map
  const { tripData, isLoading, error } = useTripDetails({
    tripId: car?.activeTripId,
    enabled: false, // Disabled - only fetch when viewing on map
    pollInterval: 60000, // 1 minute
  })

  if (!car) return null

  // Helper to format time ago
  const formatTimeAgo = (isoTimestamp?: string | null) => {
    if (!isoTimestamp) return null
    try {
      const date = new Date(isoTimestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins} min ago`
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } catch (e) {
      return null
    }
  }

  // Helper to format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            Trip Details - {car.plateNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {!car.currentTrip && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No active trip</p>
            </div>
          )}

          {car.currentTrip && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Trip Info</TabsTrigger>
                <TabsTrigger value="route">Route Preview</TabsTrigger>
              </TabsList>

              {/* Trip Info Tab */}
              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Trip ID</p>
                    <p className="text-lg font-bold font-mono">{car.currentTrip.id}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Distance</p>
                    <p className="text-lg font-bold">{car.currentTrip.distanceKm} km</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Destination</p>
                  <p className="text-lg font-semibold">{car.currentTrip.destinationName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Seats</p>
                    <p className="text-lg font-bold">{car.currentTrip.totalSeats}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Booked</p>
                    <p className="text-lg font-bold text-green-500">{car.currentTrip.bookedSeats}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {car.currentTrip.currency || "USD"} {car.currentTrip.totalRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    💡 Click "View Trip on Map" below to see detailed route, waypoints, and real-time progress
                  </p>
                </div>
              </TabsContent>

              {/* Route Preview Tab - Shows basic trip path from subscription */}
              <TabsContent value="route" className="mt-4 space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Trip Path</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                      <div>
                        <p className="text-sm font-semibold">Origin</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {car.currentTrip.start[0].toFixed(4)}, {car.currentTrip.start[1].toFixed(4)}
                        </p>
                      </div>
                    </div>
                    {car.currentTrip.history.length > 2 && (
                      <div className="flex items-center gap-2 pl-1">
                        <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-red-500" />
                        <p className="text-xs text-muted-foreground">
                          {car.currentTrip.history.length - 2} intermediate points
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
                      <div>
                        <p className="text-sm font-semibold">{car.currentTrip.destinationName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {car.currentTrip.end[0].toFixed(4)}, {car.currentTrip.end[1].toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ℹ️ Full route with waypoints and detailed progress available on map view
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* View Trip on Map Button */}
        {car.currentTrip && onViewTripOnMap && (
          <DialogFooter className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={() => {
                if (car) {
                  onViewTripOnMap(car)
                }
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Map className="w-4 h-4" />
              View Trip on Map
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
