"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Clock, MapPin, Users, Eye, Navigation, Route } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { useLiveTrips } from "@/hooks/use-live-trips"
import { LocationAddress } from "@/components/location-address"
import type { Trip } from "@/types"
import type { TripByCompany } from "@/lib/graphql/types"

// Extended Trip type with additional properties for live tracking
interface ExtendedTrip extends Trip {
  nextWaypoint?: {
    name: string
    remainingDistance?: number | null
  } | null
  currentLocationLat?: number | null
  currentLocationLon?: number | null
  currentLocationSpeed?: number | null
  completionTime?: string | null
  originalTrip?: TripByCompany
}

// Helper functions
function getStatusColor(status: Trip["status"]) {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "bg-blue-100 text-blue-800"
    case "ongoing":
    case "in_progress":
      return "bg-green-100 text-green-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getStatusLabel(status: Trip["status"]) {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "Scheduled"
    case "ongoing":
    case "in_progress":
      return "Ongoing"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

// Remove dummy tripsData - using real data from GraphQL

function TripDetailsDialog({ 
  trip, 
  isOpen, 
  onClose 
}: { 
  trip: ExtendedTrip | null
  isOpen: boolean
  onClose: () => void 
}) {
  if (!trip || !trip.originalTrip) return null

  const originalTrip = trip.originalTrip
  const tripStatus = trip.status.toLowerCase()
  const isScheduled = tripStatus === "scheduled"
  const isInProgress = tripStatus === "ongoing" || tripStatus === "in_progress"
  const isCompleted = tripStatus === "completed" || tripStatus === "cancelled"

  // Handle trips with 0 destinations
  const hasDestinations = originalTrip.destinations && originalTrip.destinations.length > 0
  
  // Logic: If 0 destinations = no waypoints, no destination
  // If 1 destination = 0 waypoints (just origin and destination)
  // If 2+ destinations = last is final destination, others are waypoints
  const hasWaypoints = hasDestinations && originalTrip.destinations.length > 1
  const waypoints = hasWaypoints ? originalTrip.destinations.slice(0, -1) : []
  const finalDestination = hasDestinations ? originalTrip.destinations[originalTrip.destinations.length - 1] : null

  // Find next waypoint/destination that hasn't been passed
  // For waypoints, check waypoints array; for single destination trips, check the destination itself
  const destinationsToCheck = hasWaypoints ? waypoints : (finalDestination ? [finalDestination] : [])
  const nextDestination = destinationsToCheck.find((dest) => !dest.isPassede) || null
  const passedDestinations = destinationsToCheck.filter((dest) => dest.isPassede)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trip Details - {trip.id}</DialogTitle>
          <DialogDescription>
            Complete trip information for {trip.licensePlate} driven by {trip.driver}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trip Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {((originalTrip.totalDistance || 0) / 1000).toFixed(2)} km
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isScheduled ? "Scheduled Departure" : isInProgress ? "Trip Started" : "Trip Created"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(originalTrip.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {isCompleted && originalTrip.updatedAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Completed: {new Date(originalTrip.updatedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Origin */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Origin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm font-medium">{originalTrip.origin.addres}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Coordinates: {originalTrip.origin.lat.toFixed(6)}, {originalTrip.origin.lng.toFixed(6)}
                </div>
              </div>
              {isScheduled && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Departure Time:</span>{" "}
                    {new Date(originalTrip.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waypoints - Only show if there are waypoints (2+ destinations) */}
          {hasDestinations && hasWaypoints && waypoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Route className="h-4 w-4 text-blue-600" />
                  Waypoints ({waypoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waypoints.map((destination, index) => {
                    const isPassed = destination.isPassede
                    const isNext = !isPassed && destination === nextDestination
                    
                    return (
                      <div
                        key={destination.id}
                        className={`p-4 rounded-lg border-2 ${
                          isPassed
                            ? "bg-green-50 border-green-200"
                            : isNext
                            ? "bg-blue-50 border-blue-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                isPassed
                                  ? "bg-green-500 text-white"
                                  : isNext
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}>
                                {index + 1}
                              </div>
                              <div className="font-medium">{destination.addres}</div>
                              {isNext && isInProgress && (
                                <Badge variant="outline" className="text-xs">Next Stop</Badge>
                              )}
                              {isPassed && (
                                <Badge variant="outline" className="text-xs bg-green-100">Passed</Badge>
                              )}
                            </div>
                            
                            <div className="ml-8 space-y-1 text-sm">
                              <div className="text-muted-foreground">
                                Coordinates: {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                              </div>
                              <div className="text-muted-foreground">
                                Fare: {new Intl.NumberFormat("en-RW", {
                                  style: "currency",
                                  currency: "RWF",
                                }).format(destination.fare || 0)}
                              </div>
                              
                              {isInProgress && isNext && destination.remainingDistance != null && (
                                <div className="text-blue-700 font-medium mt-2">
                                  <Navigation className="h-4 w-4 inline mr-1" />
                                  Remaining Distance: {(destination.remainingDistance / 1000).toFixed(2)} km
                                </div>
                              )}
                              
                              {isInProgress && !isNext && !isPassed && destination.remainingDistance != null && (
                                <div className="text-muted-foreground mt-2">
                                  Distance to waypoint: {(destination.remainingDistance / 1000).toFixed(2)} km
                                </div>
                              )}
                              
                              {isPassed && destination.passedTime && (
                                <div className="text-green-700 mt-2">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  Passed at: {new Date(destination.passedTime).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {isInProgress && nextDestination && waypoints.length > 0 && waypoints.includes(nextDestination) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-1">Next Waypoint</div>
                    <div className="text-sm text-blue-700">
                      {nextDestination.addres}
                      {nextDestination.remainingDistance != null && (
                        <span className="ml-2">
                          - {(nextDestination.remainingDistance / 1000).toFixed(2)} km remaining
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Final Destination - Only show if there's at least one destination */}
          {hasDestinations && finalDestination ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  {hasWaypoints ? "Final Destination" : "Destination"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium">{finalDestination.addres}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Coordinates: {finalDestination.lat.toFixed(6)}, {finalDestination.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Fare: {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(finalDestination.fare || 0)}
                  </div>
                  {isInProgress && !finalDestination.isPassede && finalDestination.remainingDistance != null && (
                    <div className="text-blue-700 font-medium mt-2">
                      <Navigation className="h-4 w-4 inline mr-1" />
                      Remaining Distance: {(finalDestination.remainingDistance / 1000).toFixed(2)} km
                    </div>
                  )}
                  {isInProgress && finalDestination.isPassede && finalDestination.passedTime && (
                    <div className="text-green-700 mt-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Arrived at: {new Date(finalDestination.passedTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Destination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">No destination specified for this trip</div>
              </CardContent>
            </Card>
          )}

          {/* Additional Info for Completed Trips */}
          {isCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trip Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Trip Creation Time</div>
                    <div className="text-sm font-medium mt-1">
                      {new Date(originalTrip.createdAt).toLocaleString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {originalTrip.updatedAt && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Completion Time</div>
                      <div className="text-sm font-medium mt-1">
                        {new Date(originalTrip.updatedAt).toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                  {hasDestinations && (
                    <>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Total Waypoints</div>
                        <div className="text-sm font-medium mt-1">{waypoints.length}</div>
                      </div>
                      {hasWaypoints && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Waypoints Passed</div>
                          <div className="text-sm font-medium mt-1">
                            {passedDestinations.filter(dest => waypoints.includes(dest)).length} / {waypoints.length}
                          </div>
                        </div>
                      )}
                      {finalDestination !== null && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Destination Status</div>
                          <div className="text-sm font-medium mt-1">
                            {finalDestination.isPassede ? "Arrived" : "En Route"}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!hasDestinations && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Destinations</div>
                      <div className="text-sm font-medium mt-1">0 (No destinations)</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TripsPage() {
  const { user } = useAuth()
  const { liveTrips, loading: liveTripsLoading, error: liveTripsError } = useLiveTrips(user?.companyId)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoute, setSelectedRoute] = useState("all")
  const [selectedTrip, setSelectedTrip] = useState<ExtendedTrip | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Map TripByCompany to Trip interface
  const mappedLiveTrips = useMemo((): ExtendedTrip[] => {
    return liveTrips.map((trip: TripByCompany): ExtendedTrip => {
      // Handle trips with 0 destinations
      const hasDestinations = trip.destinations && trip.destinations.length > 0
      const finalDestination = hasDestinations ? trip.destinations[trip.destinations.length - 1] : null
      const route = hasDestinations 
        ? `${trip.origin.addres} → ${finalDestination?.addres || "N/A"}`
        : `${trip.origin.addres} → No destination`
      
      // Calculate revenue from destinations - set to 0 for ongoing and completed trips
      const tripStatus = trip.status === "scheduled" ? "scheduled" : trip.status === "in_progress" || trip.status === "IN_PROGRESS" ? "ongoing" : trip.status.toLowerCase()
      const revenue = tripStatus === "scheduled" && hasDestinations 
        ? trip.destinations.reduce((sum, dest) => sum + (dest.fare || 0), 0) 
        : 0
      
      // Find next destination that hasn't been passed
      const nextDestination = hasDestinations ? trip.destinations.find((dest) => !dest.isPassede) : null
      const nextStopName = nextDestination?.addres || finalDestination?.addres || "N/A"
      const nextStopDistance = nextDestination?.remainingDistance ?? finalDestination?.remainingDistance ?? null
      
      // Calculate progress based on passed destinations
      const totalDestinations = trip.destinations?.length || 0
      const passedDestinations = hasDestinations ? trip.destinations.filter((dest) => dest.isPassede).length : 0
      let progress = totalDestinations > 0 ? Math.round((passedDestinations / totalDestinations) * 100) : 0
      
      // If status is not completed, cap progress at 99%
      if (progress === 100 && tripStatus !== "completed") {
        progress = 99
      }

      return {
        id: trip.id,
        busId: trip.carDriver.car.id,
        licensePlate: trip.carDriver.car.plate,
        driver: trip.carDriver.driver?.name || "N/A",
        route: route,
        scheduledStart: trip.createdAt,
        scheduledEnd: trip.updatedAt || "",
        estimatedDuration: `${(trip.totalDistance / 1000).toFixed(1)}km`, // Distance in km
        status: tripStatus,
        capacity: trip.carDriver.car.capacity,
        bookedSeats: 0, // Not available in new structure
        currentOccupancy: 0, // Not available in new structure
        estimatedRevenue: revenue,
        revenue: revenue,
        progress: progress,
        currentLocation: trip.carDriver.car.currentLocation?.location ? `${trip.carDriver.car.currentLocation.location.lat}, ${trip.carDriver.car.currentLocation.location.lng}` : "",
        currentLocationLat: trip.carDriver.car.currentLocation?.location?.lat,
        currentLocationLon: trip.carDriver.car.currentLocation?.location?.lng,
        currentLocationSpeed: trip.carDriver.car.currentLocation?.speed || null,
        nextStop: nextStopName,
        nextWaypoint: nextStopName !== "N/A" ? {
          name: nextStopName,
          remainingDistance: nextStopDistance,
        } : null,
        departureLocation: trip.origin.addres,
        arrivalLocation: finalDestination?.addres || (hasDestinations ? "N/A" : "No destination"),
        distance: `${(trip.totalDistance / 1000).toFixed(1)}km`,
        originalTrip: trip, // Store original trip data for details dialog
      }
    })
  }, [liveTrips])

  const upcomingTrips = mappedLiveTrips.filter((trip) => trip.status === "scheduled")
  const ongoingTrips = mappedLiveTrips.filter((trip) => trip.status === "ongoing" || trip.status === "in_progress")
  const completedTrips = mappedLiveTrips.filter((trip) => trip.status === "completed" || trip.status === "cancelled")

  const filterTrips = (tripsList: Trip[]) => {
    return tripsList.filter((trip) => {
      const matchesSearch =
        trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trip.busId && trip.busId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        trip.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.route.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRoute = selectedRoute === "all" || trip.route === selectedRoute

      return matchesSearch && matchesRoute
    })
  }


  const loading = liveTripsLoading
  const error = liveTripsError

  // Extract unique routes for filter
  const availableRoutes = useMemo(() => {
    const routes = new Set<string>()
    mappedLiveTrips.forEach((trip) => {
      if (trip.route) {
        routes.add(trip.route)
      }
    })
    return Array.from(routes).sort()
  }, [mappedLiveTrips])

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Trip Management</h1>
            <p className="text-sm text-muted-foreground">Manage all bus trips - upcoming, ongoing, and completed</p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading trips data. Please try again later.</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{upcomingTrips.length}</div>
                  <p className="text-xs text-muted-foreground">Scheduled for today</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing Trips</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{ongoingTrips.length}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed/Older Trips</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{completedTrips.length}</div>
                  <p className="text-xs text-muted-foreground">Finished trips</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Trips</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    {availableRoutes.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming ({upcomingTrips.length})</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing ({ongoingTrips.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedTrips.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bus</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterTrips(upcomingTrips).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No upcoming trips found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterTrips(upcomingTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="font-medium">{trip.licensePlate}</div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {new Date(trip.scheduledStart).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {trip.scheduledEnd && (
                              <div className="text-xs text-muted-foreground">
                                to {new Date(trip.scheduledEnd).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {trip.distance ? (
                              trip.distance.includes("km") || trip.distance.includes("KM") ? (
                                trip.distance.replace(/ (km|KM)/i, "km")
                              ) : (
                                `${trip.distance}km`
                              )
                            ) : trip.estimatedDuration ? (
                              trip.estimatedDuration.includes("km") || trip.estimatedDuration.includes("KM") ? (
                                trip.estimatedDuration.replace(/ (km|KM)/i, "km")
                              ) : (
                                `${trip.estimatedDuration}km`
                              )
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {trip.bookedSeats}/{trip.capacity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trip.bookedSeats && trip.capacity
                                ? Math.round((trip.bookedSeats / trip.capacity) * 100)
                                : 0}
                              % full
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedTrip(trip)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="ongoing" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="max-w-[200px]">Current Location</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTrips(ongoingTrips).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No ongoing trips found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterTrips(ongoingTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="font-medium">{trip.licensePlate}</div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          {trip.status === "scheduled" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Departure time:</Badge>
                              <span className="text-sm">
                                {new Date(trip.scheduledStart).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ) : trip.status === "ongoing" || trip.status === "in_progress" ? (
                            (trip as ExtendedTrip).nextWaypoint ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <Badge variant="outline" className="text-xs">Next point:</Badge>
                                    <span className="text-sm">{(trip as ExtendedTrip).nextWaypoint?.name}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-medium">{(trip as ExtendedTrip).nextWaypoint?.name}</div>
                                    {(trip as ExtendedTrip).nextWaypoint?.remainingDistance != null && (
                                      <div className="text-muted-foreground mt-1">
                                        Remaining: {(((trip as ExtendedTrip).nextWaypoint?.remainingDistance ?? 0) / 1000).toFixed(2)} km
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Next point:</Badge>
                                <span className="text-sm">{trip.nextStop || "N/A"}</span>
                              </div>
                            )
                          ) : trip.status === "completed" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm cursor-help">Completed</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {(trip as ExtendedTrip).completionTime ? (
                                  <div className="text-xs">
                                    Completed: {new Date((trip as ExtendedTrip).completionTime!).toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="text-xs">Completed</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            // Show progress bar only if progress < 100% and not completed
                            (trip.progress ?? 0) < 100 && trip.status !== "completed" ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{trip.progress ?? 0}%</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${trip.progress ?? 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm">-</div>
                            )
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center space-x-1 min-w-0">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <LocationAddress
                              latitude={(trip as ExtendedTrip).currentLocationLat}
                              longitude={(trip as ExtendedTrip).currentLocationLon}
                              address={trip.currentLocation}
                              speed={(trip as ExtendedTrip).currentLocationSpeed}
                              nextWaypoint={(trip as ExtendedTrip).nextWaypoint}
                              completionTime={(trip as ExtendedTrip).completionTime}
                              status={trip.status}
                              className="text-sm min-w-0 flex-1"
                              showLoadingIcon={true}
                              truncate={true}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {trip.currentOccupancy}/{trip.capacity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trip.currentOccupancy && trip.capacity
                                ? Math.round((trip.currentOccupancy / trip.capacity) * 100)
                                : 0}
                              % full
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedTrip(trip)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTrips(completedTrips).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No completed trips found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterTrips(completedTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="font-medium">{trip.licensePlate}</div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{trip.totalPassengers}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {trip.distance ? (
                              trip.distance.includes("km") || trip.distance.includes("KM") ? (
                                trip.distance.replace(/ (km|KM)/i, "km")
                              ) : (
                                `${trip.distance}km`
                              )
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedTrip(trip)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </main>

      {/* Trip Details Dialog */}
      <TripDetailsDialog 
        trip={selectedTrip}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedTrip(null)
        }}
      />
    </div>
  )
}
