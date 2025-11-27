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
import { Search, Calendar, Clock, MapPin, Users, Eye } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
}

// Remove dummy tripsData - using real data from GraphQL

export default function TripsPage() {
  const { user } = useAuth()
  const { liveTrips, loading: liveTripsLoading, error: liveTripsError } = useLiveTrips(user?.companyId)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoute, setSelectedRoute] = useState("all")

  // Map TripByCompany to Trip interface
  const mappedLiveTrips = useMemo((): ExtendedTrip[] => {
    return liveTrips.map((trip: TripByCompany): ExtendedTrip => {
      const finalDestination = trip.destinations[trip.destinations.length - 1]
      const route = `${trip.origin.addres} → ${finalDestination?.addres || "N/A"}`
      
      // Calculate revenue from destinations - set to 0 for ongoing and completed trips
      const tripStatus = trip.status === "scheduled" ? "scheduled" : trip.status === "in_progress" || trip.status === "IN_PROGRESS" ? "ongoing" : trip.status.toLowerCase()
      const revenue = tripStatus === "scheduled" ? trip.destinations.reduce((sum, dest) => sum + (dest.fare || 0), 0) : 0
      
      // Find next destination that hasn't been passed
      const nextDestination = trip.destinations.find((dest) => !dest.isPassede)
      const nextStopName = nextDestination?.addres || finalDestination?.addres || "N/A"
      const nextStopDistance = nextDestination?.remainingDistance ?? finalDestination?.remainingDistance ?? null
      
      // Calculate progress based on passed destinations
      const totalDestinations = trip.destinations.length
      const passedDestinations = trip.destinations.filter((dest) => dest.isPassede).length
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
        arrivalLocation: finalDestination?.addres || "N/A",
        distance: `${(trip.totalDistance / 1000).toFixed(1)}km`,
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

  const getStatusColor = (status: Trip["status"]) => {
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

  const getStatusLabel = (status: Trip["status"]) => {
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
                          <Button variant="ghost" size="sm">
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
                          <Button variant="ghost" size="sm">
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
    </div>
  )
}
