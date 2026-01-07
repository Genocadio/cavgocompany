"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, History, Navigation, Activity, MapIcon, Loader2, ChevronDown, ChevronUp, Clock, MapPin, DollarSign, Ticket } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCompanyCars } from "@/hooks/use-company-cars"
import { useTripsByCar } from "@/hooks/use-trips-by-car"
import { useTripSnapshot } from "@/hooks/use-trip-snapshot"
import { useAuth } from "@/context/auth-context"
import AppHeader from "@/components/app-header"

export default function CarManagementPage() {
  const router = useRouter()
  const params = useParams()
  const carId = params?.id as string
  const { user, isLoading: authLoading } = useAuth()
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [bookingTripId, setBookingTripId] = useState<string | null>(null)

  // Fetch all cars to find the specific one
  const { cars, isLoading: carsLoading } = useCompanyCars({
    companyId: user?.companyId ?? undefined,
    limit: 50,
    offset: 0,
  })

  // Fetch trips for this car
  const { trips, isLoading: tripsLoading, error: tripsError } = useTripsByCar({
    carId,
    enabled: !!carId,
  })

  // Fetch booking snapshot for selected trip
  const { snapshot, isLoading: snapshotLoading, error: snapshotError } = useTripSnapshot({
    tripId: bookingTripId,
    enabled: !!bookingTripId,
  })

  const selectedCar = cars.find(c => c.id === carId)

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

  // Get status color
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized.includes('active') || normalized.includes('ongoing')) return 'default'
    if (normalized.includes('completed') || normalized.includes('done')) return 'secondary'
    if (normalized.includes('cancelled')) return 'destructive'
    return 'outline'
  }

  // Format remaining distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Format passed time
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

  // Check if trip is scheduled
  const isTripScheduled = (status: string) => {
    return status.toLowerCase().includes('scheduled') || status.toLowerCase().includes('created')
  }

  // Check if trip is cancelled
  const isTripCancelled = (status: string) => {
    return status.toLowerCase().includes('cancelled')
  }

  // Get location name from snapshot or trip data
  const getLocationName = (locationId: string, type: string, order: number) => {
    // Try to match from trip destinations
    const currentTrip = trips.find(t => t.id === bookingTripId)
    if (currentTrip) {
      if (type === 'ORIGIN') {
        return currentTrip.origin.addres || 'Origin'
      }
      const dest = currentTrip.destinations.find(d => d.id === locationId)
      if (dest) {
        return dest.addres || `Stop ${order}`
      }
    }
    
    return type === 'ORIGIN' ? 'Origin' : `Stop ${order}`
  }

  if (authLoading || carsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedCar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Car not found</p>
        <Button onClick={() => router.push('/')}>Back to Fleet</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showViewSwitcher={false} />
      
      {/* Sub-header with car info */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-mono">{selectedCar.plateNumber}</h1>
              <p className="text-sm text-muted-foreground">Car Management</p>
            </div>
          </div>
          <Badge variant={selectedCar.status === "active" ? "default" : "secondary"} className="capitalize">
            {selectedCar.status}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Trips
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips" className="mt-6 space-y-4">
            {tripsLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {tripsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{tripsError}</p>
                </CardContent>
              </Card>
            )}

            {!tripsLoading && !tripsError && trips.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-12 text-center pb-12">
                  <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No trip history available</p>
                </CardContent>
              </Card>
            )}

            {!tripsLoading && !tripsError && trips.length > 0 && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {trips.length} Trip{trips.length !== 1 ? 's' : ''} Found
                  </p>

                  {trips.map((trip) => {
                    const isExpanded = expandedTripId === trip.id
                    const isScheduled = isTripScheduled(trip.status)
                    const isCancelled = isTripCancelled(trip.status)
                    const originName = trip.origin.addres || 'Unknown Origin'
                    const finalDestName = trip.destinations[trip.destinations.length - 1]?.addres || 'Unknown Destination'

                    return (
                      <Card key={trip.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-bold mb-2">
                                {originName} → {finalDestName}
                              </CardTitle>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={getStatusColor(trip.status)}>
                                  {trip.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(trip.createdAt)}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {(trip.totalDistance / 1000).toFixed(1)} km
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isCancelled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setBookingTripId(trip.id)
                                  }}
                                  className="flex items-center gap-1"
                                  title="View Booking Summary"
                                >
                                  <Ticket className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-0 space-y-3 border-t border-border">
                            <div className="pt-4">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                                All Stops ({trip.destinations.length})
                              </p>
                              
                              <div className="space-y-2">
                                {/* Origin */}
                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate">{originName}</p>
                                          <p className="text-xs text-muted-foreground">Origin</p>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground font-mono mt-1">
                                        {trip.origin.lat.toFixed(4)}, {trip.origin.lng.toFixed(4)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Destinations/Stops */}
                                {trip.destinations.map((dest, idx) => {
                                  const isPassed = dest.isPassede
                                  const isLastStop = idx === trip.destinations.length - 1

                                  return (
                                    <div 
                                      key={dest.id} 
                                      className={`p-3 rounded-lg border ${
                                        isPassed 
                                          ? 'bg-blue-500/5 border-blue-500/20' 
                                          : 'bg-muted/50 border-border'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div 
                                          className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                                            isLastStop 
                                              ? 'bg-red-500' 
                                              : isPassed 
                                                ? 'bg-blue-500' 
                                                : 'bg-gray-400'
                                          }`} 
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold truncate">{dest.addres}</p>
                                              <p className="text-xs text-muted-foreground">
                                                Stop {dest.index}
                                                {isLastStop && ' • Final Destination'}
                                              </p>
                                            </div>
                                            {dest.fare && (
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                <p className="text-sm font-bold text-emerald-500">
                                                  {dest.fare.toLocaleString()} RWF
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Show passed time or remaining distance based on status and if scheduled */}
                                          {!isScheduled && (
                                            <>
                                              {isPassed && dest.passedTime && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                                                  <Clock className="w-3 h-3" />
                                                  <span>Passed: {formatPassedTime(dest.passedTime)}</span>
                                                </div>
                                              )}
                                              {!isPassed && dest.remainingDistance !== undefined && dest.remainingDistance !== null && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                  <MapPin className="w-3 h-3" />
                                                  <span>Remaining: {formatDistance(dest.remainingDistance)}</span>
                                                </div>
                                              )}
                                            </>
                                          )}

                                          <p className="text-xs text-muted-foreground font-mono mt-1">
                                            {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Trip Summary */}
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2 bg-muted/30 rounded text-center">
                                    <p className="text-xs text-muted-foreground">Total Stops</p>
                                    <p className="text-lg font-bold">{trip.destinations.length}</p>
                                  </div>
                                  <div className="p-2 bg-muted/30 rounded text-center">
                                    <p className="text-xs text-muted-foreground">Distance</p>
                                    <p className="text-lg font-bold">{(trip.totalDistance / 1000).toFixed(2)} km</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Summary Dialog */}
      <Dialog open={!!bookingTripId} onOpenChange={(open) => !open && setBookingTripId(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-500" />
              Trip Booking Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
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
              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No booking data available for this trip</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
