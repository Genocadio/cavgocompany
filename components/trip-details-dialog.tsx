"use client"

import type { Car } from "@/lib/data"
import type { WaypointProgressDto, CarTrip } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Navigation, Clock, Loader2, Map, Ticket, Package, ArrowLeft, History, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTripDetails } from "@/hooks/use-trip-details"
import { useTripSnapshot } from "@/hooks/use-trip-snapshot"
import { useTripsByCar } from "@/hooks/use-trips-by-car"
import { useMemo, useState } from "react"

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
  const [view, setView] = useState<'current' | 'history'>('current')
  const [selectedHistoryTripId, setSelectedHistoryTripId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'route' | 'bookings'>('route')

  // Don't fetch full trip details on dialog open - use subscription data from car.currentTrip
  // Full details will be fetched only when viewing on map
  const { tripData, isLoading, error } = useTripDetails({
    tripId: car?.activeTripId,
    enabled: false, // Disabled - only fetch when viewing on map
    pollInterval: 60000, // 1 minute
  })

  // Fetch all trips for this car
  const { trips, isLoading: tripsLoading, error: tripsError } = useTripsByCar({
    carId: car?.id,
    enabled: open && view === 'history',
  })

  // Fetch trip snapshot for booking details
  const currentTripId = view === 'current' ? car?.currentTrip?.id : selectedHistoryTripId
  const snapshotEnabled = open && !!currentTripId && activeTab === 'bookings'
  const { snapshot, isLoading: snapshotLoading, error: snapshotError } = useTripSnapshot({
    tripId: currentTripId,
    enabled: snapshotEnabled,
  })

  // Reset view when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setView('current')
      setSelectedHistoryTripId(null)
    }
    onOpenChange(newOpen)
  }

  // Get the current trip being viewed (either current or from history)
  const viewingTrip = useMemo(() => {
    if (view === 'current') return car?.currentTrip
    if (selectedHistoryTripId) {
      return trips.find(t => t.id === selectedHistoryTripId)
    }
    return null
  }, [view, car?.currentTrip, selectedHistoryTripId, trips])

  // Create a map of location IDs to names from trip data
  const locationNames = useMemo(() => {
    const names: Record<string, string> = {}
    
    if (viewingTrip) {
      // For car.currentTrip
      if ('destinationName' in viewingTrip) {
        names[String(viewingTrip.id) + "_origin"] = "Origin"
        if (viewingTrip.destinationName) {
          names[String(viewingTrip.id) + "_dest"] = viewingTrip.destinationName
        }
      }
      
      // For CarTrip (history)
      if ('origin' in viewingTrip && 'destinations' in viewingTrip) {
        const histTrip = viewingTrip as CarTrip
        names[histTrip.origin.id] = histTrip.origin.addres || "Origin"
        histTrip.destinations.forEach((dest) => {
          names[dest.id] = dest.addres || `Stop ${dest.index}`
        })
      }
    }

    // If we have trip details with waypoints, use those
    if (tripData?.trip?.waypoints) {
      tripData.trip.waypoints.forEach((waypoint) => {
        if (waypoint.id) {
          names[waypoint.id] = waypoint.name || `Waypoint ${waypoint.id}`
        }
      })
    }

    return names
  }, [viewingTrip, tripData])

  // Helper to get location name by ID
  const getLocationName = (locationId: string, type: string, order: number) => {
    // If snapshot provides an address for this location, prefer it
    if (snapshot?.locations) {
      const found = snapshot.locations.find((l) => l.locationId === locationId)
      if (found?.addres) return found.addres
    }
    // First try to match from our location names map
    if (locationNames[locationId]) {
      return locationNames[locationId]
    }
    
    // If we have snapshot locations, try to infer from order and type
    if (type === 'ORIGIN') {
      return 'Origin'
    }
    
    if (type === 'DESTINATION') {
      if (order === 1 && viewingTrip && 'destinationName' in viewingTrip) {
        return viewingTrip.destinationName
      }
      return `Stop ${order}`
    }
    
    return `Location ${locationId.substring(0, 8)}`
  }

  // Format date helper
  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoDate
    }
  }

  // Get trip status badge color
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized.includes('active') || normalized.includes('ongoing')) return 'default'
    if (normalized.includes('completed') || normalized.includes('done')) return 'secondary'
    if (normalized.includes('cancelled')) return 'destructive'
    return 'outline'
  }

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

  // Helper to check if trip is scheduled
  const isTripScheduled = (status: string) => {
    return status.toLowerCase().includes('scheduled') || status.toLowerCase().includes('created')
  }

  // Helper to format remaining time
  const formatRemainingTime = (isoDate: string | null | undefined) => {
    if (!isoDate) return null
    try {
      const estimatedTime = new Date(isoDate)
      const now = new Date()
      const diffMs = estimatedTime.getTime() - now.getTime()
      
      if (diffMs < 0) return 'Overdue'
      
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Arriving soon'
      if (diffMins < 60) return `${diffMins} min`
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`
      
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ${diffHours % 24}h`
    } catch (e) {
      return null
    }
  }

  // Helper to format passed time
  const formatPassedTime = (isoDate: string | null | undefined) => {
    if (!isoDate) return null
    try {
      const date = new Date(isoDate)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return null
    }
  }

  // Helper to get origin/destination names for currentTrip (prefer snapshot addres)
  const getCurrentTripNames = () => {
    if (!car?.currentTrip) return { originName: 'Origin', finalName: 'Destination' }

    const originFromSnapshot = snapshot?.locations?.find((l) => l.type === 'ORIGIN')?.addres
    const destFromSnapshot = snapshot?.locations
      ?.filter((l) => l.type === 'DESTINATION')
      .sort((a, b) => a.order - b.order)
      .pop()?.addres

    const originName = originFromSnapshot || locationNames[String(car.currentTrip.id) + "_origin"] || 'Origin'
    const finalName = destFromSnapshot || car.currentTrip.destinationName || locationNames[String(car.currentTrip.id) + "_dest"] || 'Destination'

    return { originName, finalName }
  }

  // Precompute route data to keep hooks stable
  const isCurrentTripScheduled = useMemo(() => {
    if (view !== 'current') return false
    return isTripScheduled(car?.currentTrip?.status || '')
  }, [view, car?.currentTrip?.status])

  const isCurrentTripCompleted = useMemo(() => {
    if (view !== 'current') return false
    const status = (car?.currentTrip?.status || '').toLowerCase()
    return status.includes('completed') || status.includes('done')
  }, [view, car?.currentTrip?.status])

  const routeStops = useMemo(() => {
    if (view === 'current' && car?.currentTrip?.destinations) {
      return car.currentTrip.destinations
    }
    if (view === 'history' && viewingTrip && 'destinations' in viewingTrip) {
      return (viewingTrip as any).destinations || []
    }
    return []
  }, [view, car?.currentTrip?.destinations, viewingTrip])

  const routeLocations = useMemo(() => {
    if (view !== 'current' || !car?.currentTrip) return []

    const arr: Array<{
      id: string
      name: string
      type: 'ORIGIN' | 'DESTINATION'
      order: number
      isPassed?: boolean
      remainingDistance?: number
    }> = []

    const originName = car.currentTrip.originName || 'Origin'
    arr.push({
      id: `${car.currentTrip.id}-origin`,
      name: originName,
      type: 'ORIGIN',
      order: 0,
      isPassed: !isCurrentTripScheduled,
    })

    routeStops.forEach((d, idx) => {
      arr.push({
        id: d.id?.toString() || `dest-${idx}`,
        name: d.addres || `Stop ${d.index ?? idx + 1}`,
        type: 'DESTINATION',
        order: idx + 1,
        isPassed: d.isPassed,
        remainingDistance: d.remainingDistance,
      })
    })

    return arr
  }, [view, car?.currentTrip, routeStops, isCurrentTripScheduled])

  const firstUnpassedDestination = useMemo(() => {
    if (view !== 'current') return null
    if (isCurrentTripScheduled || isCurrentTripCompleted) return null
    return routeLocations.find((loc) => loc.type === 'DESTINATION' && !loc.isPassed) || null
  }, [view, isCurrentTripScheduled, isCurrentTripCompleted, routeLocations])

  if (view === 'current' && car?.currentTrip) {
    console.log('[TripDetailsDialog] route locations (trip data)', {
      status: car.currentTrip.status,
      locations: routeLocations,
      firstUnpassed: firstUnpassedDestination,
    })
  }

  if (!car) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'history' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setView('current')
                  setSelectedHistoryTripId(null)
                }}
                className="mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Navigation className="w-5 h-5 text-emerald-500" />
            {view === 'current' ? `Trip Details - ${car.plateNumber}` : `Trip History - ${car.plateNumber}`}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Current Trip View - Route Preview + Booking Snapshot */}
          {view === 'current' && (
            <>
              {!car.currentTrip && (
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">No active trip</p>
                </div>
              )}

              {car.currentTrip && (
                <Tabs defaultValue="route" className="w-full" onValueChange={(val) => setActiveTab(val as 'route' | 'bookings')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="route">Route</TabsTrigger>
                    <TabsTrigger value="bookings">Booking Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="route" className="space-y-4">
                    {/* Trip Status - Only for scheduled and completed trips */}
                    {isCurrentTripScheduled && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Departure Time</p>
                        <p className="text-lg font-bold">
                          {car.currentTrip.createdAt ? formatDate(car.currentTrip.createdAt) : 'Not set'}
                        </p>
                      </div>
                    )}

                    {isCurrentTripCompleted && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Completed</p>
                        <p className="text-lg font-bold">
                          {car.currentTrip.createdAt ? formatDate(car.currentTrip.createdAt) : 'Not set'}
                        </p>
                      </div>
                    )}

                    {/* Locations List derived from trip data (no snapshot unless bookings tab) */}
                    {routeLocations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Locations</p>
                        {routeLocations.map((location, idx) => {
                          const isOrigin = location.type === 'ORIGIN'
                          const isFinalDest = location.type === 'DESTINATION' && idx === routeLocations.length - 1
                          const isPassed = location.isPassed || (isOrigin && !isCurrentTripScheduled)
                          const isFirstUnpassed = firstUnpassedDestination && location.id === firstUnpassedDestination.id

                          return (
                            <div key={`${location.id}-${idx}`} className="p-3 bg-muted/50 rounded-lg border border-border">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                                    isOrigin ? 'bg-green-500' : isFinalDest ? 'bg-red-500' : 'bg-blue-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{location.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {isOrigin ? 'Origin' : isFinalDest ? 'Final Destination' : `Stop ${location.order}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                  {isPassed && (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Passed</Badge>
                                  )}
                                  {isFirstUnpassed && (
                                    <Badge variant="secondary">Next</Badge>
                                  )}
                                  {isFirstUnpassed && location.remainingDistance != null && (
                                    <span className="text-xs font-semibold text-emerald-600">{formatDistance(location.remainingDistance)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="bookings" className="space-y-4">
                    {/* Booking Summary for Current Trip */}
                    {snapshotLoading && (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}

                    {snapshotError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{snapshotError}</p>
                      </div>
                    )}

                    {snapshot && !snapshotLoading && (
                      <>
                        {/* Capacity Summary Cards */}
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
                          {snapshot.locations.map((location, idx) => (
                            <div
                              key={`${location.locationId}-${idx}`}
                              className="p-3 bg-muted/50 rounded-lg border border-border"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    location.type === 'ORIGIN' ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {getLocationName(location.locationId, location.type, location.order)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {location.type === 'ORIGIN' ? 'Origin' : `Stop ${location.order}`} • {location.status}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/50">
                                <div>
                                  <p className="text-xs text-muted-foreground">Pickup</p>
                                  <p className="text-sm font-bold text-green-500">{location.seats.pickup}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Dropoff</p>
                                  <p className="text-sm font-bold text-blue-500">{location.seats.dropoff}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Pending</p>
                                  <p className="text-sm font-bold text-amber-500">{location.seats.pendingPayment}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Available</p>
                                  <p className="text-sm font-bold">{location.seats.availableFromHere}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Occupancy Rate */}
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupancy Rate</p>
                          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full transition-all"
                              style={{
                                width: `${
                                  (snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <p className="text-sm font-bold mt-2">
                            {Math.round(
                              (snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100
                            )}%
                          </p>
                        </div>
                      </>
                    )}

                    {!snapshotLoading && !snapshotError && !snapshot && (
                      <div className="p-8 bg-muted/50 border border-border rounded-lg text-center">
                        <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">No booking data available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          {/* Trip History - Note: rest of this remains the same but removing ArrowRight below */}
          {view === 'history' && !selectedHistoryTripId && (
            <div className="space-y-3">
              {tripsLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {tripsError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{tripsError}</p>
                </div>
              )}

              {!tripsLoading && !tripsError && trips.length === 0 && (
                <div className="p-8 bg-muted/50 border border-border rounded-lg text-center">
                  <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No trip history available</p>
                </div>
              )}

              {!tripsLoading && !tripsError && trips.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                    {trips.length} Trip{trips.length !== 1 ? 's' : ''} Found
                  </p>
                  {trips.map((trip) => {
                    const originName = trip.origin.addres || 'Unknown'
                    const destName = trip.destinations[trip.destinations.length - 1]?.addres || 'Unknown'
                    return (
                      <div
                        key={trip.id}
                        onClick={() => setSelectedHistoryTripId(trip.id)}
                        className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-base font-bold mb-1">
                              {originName} → {destName}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getStatusColor(trip.status)} className="text-xs">
                                {trip.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(trip.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                          <span>{trip.destinations.length} stop{trip.destinations.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{(trip.totalDistance / 1000).toFixed(1)} km</span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* Selected History Trip Details */}
          {view === 'history' && selectedHistoryTripId && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHistoryTripId(null)}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trip List
              </Button>

              {/* Get selected trip details */}
              {(() => {
                const selectedTrip = trips.find(t => t.id === selectedHistoryTripId)
                if (!selectedTrip) return null

                return (
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Trip Details</TabsTrigger>
                      <TabsTrigger value="bookings">Booking Summary</TabsTrigger>
                    </TabsList>

                    {/* Trip Details Tab */}
                    <TabsContent value="details" className="mt-4 space-y-4">
                    {snapshotLoading && (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}

                    {snapshotError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{snapshotError}</p>
                      </div>
                    )}

                    {!snapshotLoading && !snapshotError && snapshot && (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Seats</p>
                            <p className="text-2xl font-bold text-emerald-500">{snapshot.capacity.totalSeats}</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Occupied</p>
                            <p className="text-2xl font-bold text-blue-500">{snapshot.capacity.occupiedSeats}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Available</p>
                            <p className="text-2xl font-bold text-green-500">{snapshot.capacity.availableSeats}</p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Pending Payment</p>
                            <p className="text-2xl font-bold text-amber-500">{snapshot.capacity.pendingPaymentSeats}</p>
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
                          {snapshot.locations.map((location, idx) => (
                            <div
                              key={`${location.locationId}-${idx}`}
                              className="p-3 bg-muted/50 rounded-lg border border-border"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    location.type === 'ORIGIN' ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {getLocationName(location.locationId, location.type, location.order)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {location.type === 'ORIGIN' ? 'Origin' : `Stop ${location.order}`} • {location.status}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/50">
                                <div>
                                  <p className="text-xs text-muted-foreground">Pickup</p>
                                  <p className="text-sm font-bold text-green-500">{location.seats.pickup}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Dropoff</p>
                                  <p className="text-sm font-bold text-blue-500">{location.seats.dropoff}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Pending</p>
                                  <p className="text-sm font-bold text-amber-500">{location.seats.pendingPayment}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Available</p>
                                  <p className="text-sm font-bold">{location.seats.availableFromHere}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {!snapshotLoading && !snapshotError && !snapshot && (
                      <div className="p-4 bg-muted/50 border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">No booking data available for this trip</p>
                      </div>
                    )}
                    </TabsContent>
                  </Tabs>
                )
              })()}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="mt-6 pt-4 border-t border-border">
          {view === 'current' && car.currentTrip && (
            <div className="flex gap-2 w-full">
              {onViewTripOnMap && (
                <Button
                  onClick={() => {
                    if (car) {
                      onViewTripOnMap(car)
                    }
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Map className="w-4 h-4" />
                  View Trip on Map
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
