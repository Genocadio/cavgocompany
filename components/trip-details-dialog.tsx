"use client"

import type { Car } from "@/lib/data"
import type { WaypointProgressDto } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Navigation, Clock, Loader2 } from "lucide-react"
import { useTripDetails } from "@/hooks/use-trip-details"

export default function TripDetailsDialog({
  open,
  onOpenChange,
  car,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  car?: Car
}) {
  const { tripData, isLoading, error } = useTripDetails({
    tripId: car?.activeTripId,
    enabled: open && !!car?.activeTripId,
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
          {isLoading && !tripData && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!car.activeTripId && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No active trip</p>
            </div>
          )}

          {tripData?.trip && (
            <Tabs defaultValue="route" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="route">Trip Progress</TabsTrigger>
                <TabsTrigger value="info">Trip Info</TabsTrigger>
              </TabsList>

              {/* Trip Progress Tab */}
              <TabsContent value="route" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Waypoints Progress</p>
                  
                  {tripData.trip.waypointProgresses?.map((waypoint: WaypointProgressDto) => {
                    const isPassed = waypoint.state === 'DONE'
                    const isArrived = waypoint.state === 'ARRIVED'
                    const isApproaching = waypoint.state === 'APPROACHING'
                    const bgColor = isPassed ? 'bg-green-500/10' : isArrived ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                    const borderColor = isPassed ? 'border-green-500/20' : isArrived ? 'border-yellow-500/20' : 'border-blue-500/20'
                    const textColor = isPassed ? 'text-green-600' : isArrived ? 'text-yellow-600' : 'text-blue-600'

                    return (
                      <div
                        key={`waypoint-${waypoint.waypointIndex}`}
                        className={`p-3 rounded-lg border transition-all ${bgColor} ${borderColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold ${textColor}`}>
                                #{waypoint.waypointIndex + 1}
                              </span>
                              <p className="text-sm font-semibold">
                                {waypoint.waypointName || `Waypoint ${waypoint.waypointIndex + 1}`}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                            </p>
                            
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              {isPassed && waypoint.arrivedAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-muted-foreground">
                                    Passed {formatTimeAgo(waypoint.arrivedAt)}
                                  </span>
                                </div>
                              )}
                              {isArrived && waypoint.arrivedAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-muted-foreground">
                                    Arrived {formatTimeAgo(waypoint.arrivedAt)}
                                  </span>
                                </div>
                              )}
                              {isApproaching && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Distance: </span>
                                    <span className="font-bold">{formatDistance(waypoint.remainingDistance)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">ETA: </span>
                                    <span className="font-bold">{Math.round(waypoint.remainingTime / 60)} min</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-bold uppercase ${textColor}`}>
                              {waypoint.state}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {tripData.trip.route && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Route Stats</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Distance:</p>
                        <p className="font-bold">{formatDistance(tripData.trip.route.totalDistance)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Duration:</p>
                        <p className="font-bold">{Math.round(tripData.trip.route.totalDuration / 60)} min</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Trip Info Tab */}
              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Trip ID</p>
                    <p className="text-lg font-bold font-mono">{tripData.trip.id}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status</p>
                    <p className="text-lg font-bold capitalize">{tripData.trip.status.toLowerCase()}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Created</p>
                  <p className="text-sm">
                    {new Date(tripData.trip.createdAt).toLocaleString()}
                  </p>
                </div>

                {tripData.trip.completedAt && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Completed</p>
                    <p className="text-sm">
                      {new Date(tripData.trip.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {tripData.currentLocation && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Current Location</p>
                    <div className="space-y-1 text-sm">
                      <p className="font-mono">
                        {tripData.currentLocation.latitude.toFixed(6)}, {tripData.currentLocation.longitude.toFixed(6)}
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span>Speed: <strong>{tripData.currentLocation.speed.toFixed(1)} m/s</strong></span>
                        {tripData.currentLocation.heading && (
                          <span>Heading: <strong>{tripData.currentLocation.heading.toFixed(0)}°</strong></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatTimeAgo(tripData.currentLocation.timestamp)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Settings</p>
                  <div className="space-y-1 text-sm">
                    <p>Include Origin: <strong>{tripData.trip.includeOrigin ? 'Yes' : 'No'}</strong></p>
                    <p>City Trip: <strong>{tripData.trip.isCityTrip ? 'Yes' : 'No'}</strong></p>
                    <p>Total Waypoints: <strong>{tripData.trip.waypoints.length}</strong></p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

