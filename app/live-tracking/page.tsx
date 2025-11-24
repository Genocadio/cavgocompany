"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, Clock, Users, CreditCard, Navigation, RefreshCw, Eye, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { useCarsByCompany } from "@/hooks/use-cars-by-company"
import { useBookingsByTrip } from "@/hooks/use-bookings-by-trip"
import { LocationAddress } from "@/components/location-address"
import type { Car, Booking } from "@/lib/graphql/types"

// Remove dummy liveTrackingData - using real data from GraphQL

type Trip = {
  id: string;
  startTime: string;
  estimatedEnd: string;
  progress: number;
  status?: string;
  departureTime?: string;
  completionTime?: string | null;
  currentLocation: string;
  currentLocationLat?: number | null;
  currentLocationLon?: number | null;
  currentLocationSpeed?: number | null;
  nextStop: string;
  nextWaypoint?: {
    name: string;
    remainingDistance?: number | null;
  } | null;
  ticketsSold: number;
  revenue: number;
  occupancy: number;
  capacity: number;
}

type Bus = {
  id: string;
  licensePlate: string;
  driver: string;
  route: string;
  currentTrip: Trip;
  status: string;
  alerts: string[];
}

function TripDetailsDialog({ trip, bus, isOpen, onClose }: { trip: Trip; bus: Bus; isOpen: boolean; onClose: () => void }) {
  // Fetch bookings for this trip
  const { bookings, loading: bookingsLoading } = useBookingsByTrip(trip.id)

  // Calculate revenue from PAID and BOARDED bookings only
  const totalRevenue = useMemo(() => {
    return bookings
      .filter((booking: Booking) => booking.status === "PAID" || booking.status === "BOARDED")
      .reduce((sum: number, booking: Booking) => sum + booking.fare, 0)
  }, [bookings])

  if (!trip || !bus) return null

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return "secondary"
      case "PAID":
        return "default"
      case "BOARDED":
        return "default"
      case "CANCELLED":
        return "destructive"
      case "EXPIRED":
        return "secondary"
      default:
        return "secondary"
    }
  }

  // Helper function to format status text
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Format boarding time
  const formatBoardingTime = (booking: Booking) => {
    if (booking.scheduledTime) {
      return new Date(booking.scheduledTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    if (booking.createdAt) {
      return new Date(booking.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    return "N/A"
  }

  // Normalize payment method: MOMO -> Mobile, NFC -> Card
  const normalizePaymentMethod = (paymentMethod: string) => {
    const upper = paymentMethod.toUpperCase()
    if (upper === "MOMO" || upper === "MOBILEMONEY" || upper === "MOBILE_MONEY") {
      return "Mobile"
    }
    if (upper === "NFC") {
      return "Card"
    }
    return paymentMethod
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] w-[90vw] sm:!max-w-[90vw] md:!max-w-[90vw] lg:!max-w-[90vw] h-[95vh] max-h-[95vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle>Trip Details - {trip.id}</DialogTitle>
          <DialogDescription>
            Live passenger information for {bus.id} on {bus.route}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 overflow-y-auto overflow-x-hidden h-full pr-2">
          {/* Trip Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Next Position</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.nextWaypoint ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{trip.nextWaypoint.name}</div>
                    {trip.nextWaypoint.remainingDistance != null && (
                      <div className="text-xs text-muted-foreground">
                        Remaining: {((trip.nextWaypoint.remainingDistance / 1000).toFixed(2))} km
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Passengers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {trip.occupancy}/{trip.capacity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bookings.filter((b: Booking) => b.status === "BOARDED").length} boarded,{" "}
                    {bookings.filter((b: Booking) => b.status === "PAID" || b.status === "PENDING_PAYMENT").length} pending
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(totalRevenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bookings.filter((b: Booking) => b.status === "PAID" || b.status === "BOARDED").length} paid bookings
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Passenger List */}
          <Card>
            <CardHeader>
              <CardTitle>Live Passenger Status</CardTitle>
              <CardDescription>Real-time boarding status and passenger information</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-hidden">
              <div className="w-full">
                <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Drop-off Location</TableHead>
                    <TableHead>Boarding Time</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No bookings found for this trip
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking: Booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {formatStatus(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{booking.customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{booking.pickupLocation.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-red-600" />
                            <span className="text-sm">{booking.dropoffLocation.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatBoardingTime(booking)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(booking.fare)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              normalizePaymentMethod(booking.paymentMethod) === "Card"
                                ? "default"
                                : normalizePaymentMethod(booking.paymentMethod) === "Cash"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {normalizePaymentMethod(booking.paymentMethod)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Trip Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Card Payments:</span>
                    <span>
                      {bookings.filter((b: Booking) => 
                        normalizePaymentMethod(b.paymentMethod) === "Card"
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash Payments:</span>
                    <span>
                      {bookings.filter((b: Booking) => 
                        normalizePaymentMethod(b.paymentMethod) === "Cash"
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mobile Payments:</span>
                    <span>
                      {bookings.filter((b: Booking) => 
                        normalizePaymentMethod(b.paymentMethod) === "Mobile"
                      ).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Boarding Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Boarded:</span>
                    <span className="text-green-600">{bookings.filter((b: Booking) => b.status === "BOARDED").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Paid:</span>
                    <span className="text-blue-600">{bookings.filter((b: Booking) => b.status === "PAID").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Payment:</span>
                    <span className="text-yellow-600">{bookings.filter((b: Booking) => b.status === "PENDING_PAYMENT").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cancelled:</span>
                    <span className="text-red-600">{bookings.filter((b: Booking) => b.status === "CANCELLED").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expired:</span>
                    <span className="text-gray-600">{bookings.filter((b: Booking) => b.status === "EXPIRED").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Occupancy:</span>
                    <span>{Math.round((trip.occupancy / trip.capacity) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trip Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Driver:</span>
                    <span>{bus.driver}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function LiveTrackingPage() {
  const { user } = useAuth()
  const { cars, loading, error, refetch } = useCarsByCompany(user?.companyId)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoute, setSelectedRoute] = useState("all")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedBusForTrip, setSelectedBusForTrip] = useState<Bus | null>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)

  // Map GraphQL Car data to Bus/Trip types
  const buses = useMemo(() => {
    return cars
      .filter((car: Car) => car.activeTrip !== null) // Only show cars with active trips
      .map((car: Car) => {
        const occupancy = car.capacity - (car.activeTrip?.remainingSeats || 0)
        
        // Find next waypoint or destination
        const nextWaypoint = car.activeTrip?.waypoints?.find((wp) => !wp.passed)
        const nextStopName = nextWaypoint?.placename || car.activeTrip?.destination?.placename || "N/A"
        const nextStopDistance = nextWaypoint?.remainingDistance ?? car.activeTrip?.destination?.remainingDistance ?? null
        
        // Calculate progress based on waypoints
        const totalWaypoints = car.activeTrip?.waypoints?.length || 0
        const passedWaypoints = car.activeTrip?.waypoints?.filter((wp) => wp.passed).length || 0
        let progress = totalWaypoints > 0 ? Math.round((passedWaypoints / totalWaypoints) * 100) : 0
        
        // If status is not completed, cap progress at 99% (never show 100% for non-completed trips)
        if (progress === 100) {
          progress = 99
        }

        const revenue = car.activeTrip?.waypoints?.reduce((sum, wp) => sum + (wp.fare || 0), 0) || 0
        
        // Determine trip status
        const tripStatus = car.activeTrip?.status 
          ? (car.activeTrip.status === "scheduled" ? "scheduled" : 
             car.activeTrip.status === "in_progress" || car.activeTrip.status === "IN_PROGRESS" ? "in_progress" : 
             car.activeTrip.status.toLowerCase())
          : "in_progress" // Default for active trips

        return {
          id: car.id,
          licensePlate: car.plate,
          driver: car.driver?.name || "Not Assigned",
          route: car.activeTrip
            ? `${car.activeTrip.origin.placename} → ${car.activeTrip.destination.placename}`
            : "Not Assigned",
          currentTrip: {
            id: car.activeTrip!.id,
            startTime: new Date(car.activeTrip!.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            estimatedEnd: car.activeTrip!.endTime
              ? new Date(car.activeTrip!.endTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A",
            progress: progress,
            status: tripStatus,
            departureTime: car.activeTrip!.departureTime,
            completionTime: car.activeTrip!.endTime || null,
            currentLocation: car.currentLocation?.address || "",
            currentLocationLat: car.currentLocation?.latitude,
            currentLocationLon: car.currentLocation?.longitude,
            currentLocationSpeed: car.currentLocation?.speed || null,
            nextStop: nextStopName,
            nextWaypoint: nextStopName !== "N/A" ? {
              name: nextStopName,
              remainingDistance: nextStopDistance,
            } : null,
            ticketsSold: occupancy,
            revenue: revenue,
            occupancy: occupancy,
            capacity: car.capacity,
          },
          status: car.operationalStatus || "UNKNOWN",
          alerts: occupancy >= car.capacity * 0.9 ? ["High Occupancy"] : [],
        }
      })
  }, [cars])


  // Extract unique routes from buses with active trips
  const availableRoutes = useMemo(() => {
    const routes = new Set<string>()
    buses.forEach((bus) => {
      if (bus.route && bus.route !== "Not Assigned") {
        routes.add(bus.route)
      }
    })
    return Array.from(routes).sort()
  }, [buses])

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driver.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRoute = selectedRoute === "all" || bus.route === selectedRoute

    return matchesSearch && matchesRoute
  })

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }


  const manualRefresh = () => {
    // Refetch in background without blocking UI
    if (refetch) {
      refetch()
    }
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Live Fleet Tracking</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring of all active buses</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={manualRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Now
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading live tracking data. Please try again later.</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{buses.length}</div>
                  <p className="text-xs text-muted-foreground">Currently on routes</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{buses.reduce((acc, bus) => acc + bus.currentTrip.occupancy, 0)}</div>
                  <p className="text-xs text-muted-foreground">Across all buses</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(buses.reduce((acc, bus) => acc + bus.currentTrip.revenue, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Current trips</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{buses.reduce((acc, bus) => acc + bus.alerts.length, 0)}</div>
                  <p className="text-xs text-muted-foreground">Active alerts</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Fleet Status</CardTitle>
                <CardDescription>Real-time fleet monitoring</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search buses..."
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
                    <TableHead className="max-w-[200px]">Current Location</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No active trips found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell>
                      <div className="font-medium">{bus.licensePlate}</div>
                    </TableCell>
                    <TableCell className="font-medium">{bus.driver}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bus.route}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 min-w-0">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <LocationAddress
                          latitude={bus.currentTrip.currentLocationLat}
                          longitude={bus.currentTrip.currentLocationLon}
                          address={bus.currentTrip.currentLocation}
                          speed={bus.currentTrip.currentLocationSpeed}
                          nextWaypoint={bus.currentTrip.nextWaypoint}
                          status="in_progress"
                          className="text-sm min-w-0 flex-1"
                          showLoadingIcon={true}
                          truncate={true}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {bus.currentTrip.status === "scheduled" ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Departure time:</Badge>
                          <span className="text-sm">
                            {bus.currentTrip.departureTime ? (
                              new Date(bus.currentTrip.departureTime).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            ) : (
                              "Scheduled"
                            )}
                          </span>
                        </div>
                      ) : bus.currentTrip.status === "in_progress" || bus.currentTrip.status === "ongoing" ? (
                        bus.currentTrip.nextWaypoint ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <Badge variant="outline" className="text-xs">Next point:</Badge>
                                <span className="text-sm">{bus.currentTrip.nextWaypoint.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-medium">{bus.currentTrip.nextWaypoint.name}</div>
                                {bus.currentTrip.nextWaypoint.remainingDistance != null && (
                                  <div className="text-muted-foreground mt-1">
                                    Remaining: {((bus.currentTrip.nextWaypoint.remainingDistance / 1000).toFixed(2))} km
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Next point:</Badge>
                            <span className="text-sm">{bus.currentTrip.nextStop || "N/A"}</span>
                          </div>
                        )
                      ) : bus.currentTrip.status === "completed" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm cursor-help">Completed</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {bus.currentTrip.completionTime ? (
                              <div className="text-xs">
                                Completed: {new Date(bus.currentTrip.completionTime).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-xs">Completed</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        // Show progress bar only if progress < 100% and not completed
                        bus.currentTrip.progress < 100 && bus.currentTrip.status !== "completed" ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Trip Progress</span>
                              <span>{Math.round(bus.currentTrip.progress)}%</span>
                            </div>
                            <Progress value={bus.currentTrip.progress} className="h-2" />
                          </div>
                        ) : (
                          <div className="text-sm">-</div>
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div
                          className={`text-sm font-medium ${getOccupancyColor(bus.currentTrip.occupancy, bus.currentTrip.capacity)}`}
                        >
                          {bus.currentTrip.occupancy}/{bus.currentTrip.capacity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((bus.currentTrip.occupancy / bus.currentTrip.capacity) * 100)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {new Intl.NumberFormat("en-RW", {
                            style: "currency",
                            currency: "RWF",
                          }).format(bus.currentTrip.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">{bus.currentTrip.ticketsSold} tickets</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTrip(bus.currentTrip)
                          setSelectedBusForTrip(bus)
                          setShowTripDetails(true)
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
          </CardContent>
        </Card>

        {/* Alerts Section */}
        {buses.some((bus) => bus.alerts.length > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Active Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {buses
                  .filter((bus) => bus.alerts.length > 0)
                  .map((bus) => (
                    <div key={bus.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{bus.id}</span>
                        <span className="text-sm text-muted-foreground ml-2">{bus.alerts.join(", ")}</span>
                      </div>
                      <Badge variant="secondary">Alert</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        {selectedTrip && selectedBusForTrip && (
          <TripDetailsDialog
            trip={selectedTrip}
            bus={selectedBusForTrip}
            isOpen={showTripDetails}
            onClose={() => setShowTripDetails(false)}
          />
        )}
      </main>
    </div>
  )
}
