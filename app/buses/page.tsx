"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, Gauge, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useCarsByCompany } from "@/hooks/use-cars-by-company"
import { LocationAddress } from "@/components/location-address"
import type { Car } from "@/lib/graphql/types"

// Remove dummy busData array - using real data from GraphQL

interface Bus {
  id: string;
  licensePlate: string;
  driver: string;
  driverId: string;
  status: string;
  totalTripsToday?: number;
  todayRevenue?: number;
  currentTrip: {
    id: string;
    startTime: string;
    estimatedEnd: string;
    ticketsSold: number;
    revenue: number;
    nextStop: string;
  } | null;
  capacity?: number;
  occupancy?: number;
  location: string;
  locationLat?: number | null;
  locationLon?: number | null;
  speed?: number;
  route?: string;
}

interface BusDetailsDialogProps {
  bus: Bus;
  isOpen: boolean;
  onClose: () => void;
}

function BusDetailsDialog({ bus, isOpen, onClose }: BusDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bus Details - {bus.id}</DialogTitle>
          <DialogDescription>Comprehensive information for {bus.licensePlate}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Current Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <LocationAddress
                    latitude={bus.locationLat}
                    longitude={bus.locationLon}
                    address={bus.location}
                    className="text-sm"
                    showLoadingIcon={true}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today&apos;s Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bus.totalTripsToday}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today&apos;s Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-RW", {
                    style: "currency",
                    currency: "RWF",
                  }).format(bus.todayRevenue || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Trip */}
          {bus.currentTrip && (
            <Card>
              <CardHeader>
                <CardTitle>Current Trip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Trip ID:</span>
                      <span className="text-sm font-medium">{bus.currentTrip.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Start Time:</span>
                      <span className="text-sm font-medium">{bus.currentTrip.startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. End:</span>
                      <span className="text-sm font-medium">{bus.currentTrip.estimatedEnd}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tickets Sold:</span>
                      <span className="text-sm font-medium">{bus.currentTrip.ticketsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue:</span>
                      <span className="text-sm font-medium">
                        {new Intl.NumberFormat("en-RW", {
                          style: "currency",
                          currency: "RWF",
                        }).format(bus.currentTrip.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Next Stop:</span>
                      <span className="text-sm font-medium">{bus.currentTrip.nextStop}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


export default function BusesPage() {
  const { user } = useAuth()
  const { cars, loading, error } = useCarsByCompany(user?.companyId)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBus] = useState<Bus | null>(null)
  const [showBusDetails, setShowBusDetails] = useState(false)

  // Map GraphQL Car data to Bus interface
  const buses = useMemo(() => {
    return cars.map((car: Car) => {
      const occupancy = car.activeTrip
        ? car.capacity - car.activeTrip.remainingSeats
        : 0
      const nextStop = car.activeTrip?.waypoints?.find((wp) => !wp.passed)?.placename || 
                      car.activeTrip?.destination?.placename || 
                      "N/A"
      
      return {
        id: car.id,
        licensePlate: car.plate,
        driver: car.driver?.name || "Not Assigned",
        driverId: car.driver?.id || "",
        status: car.operationalStatus || "UNKNOWN",
        capacity: car.capacity,
        occupancy: occupancy,
        location: car.currentLocation?.address || "",
        locationLat: car.currentLocation?.latitude,
        locationLon: car.currentLocation?.longitude,
        speed: car.currentLocation?.speed || 0,
        route: car.activeTrip ? `${car.activeTrip.origin.placename} → ${car.activeTrip.destination.placename}` : "Not Assigned",
        currentTrip: car.activeTrip
          ? {
              id: car.activeTrip.id,
              startTime: new Date(car.activeTrip.startTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              estimatedEnd: car.activeTrip.endTime
                ? new Date(car.activeTrip.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A",
              ticketsSold: occupancy,
              revenue: car.activeTrip.waypoints?.reduce((sum, wp) => sum + (wp.fare || 0), 0) || 0,
              nextStop: nextStop,
            }
          : null,
        totalTripsToday: 0, // Not available in GraphQL response
        todayRevenue: 0, // Not available in GraphQL response
      }
    })
  }, [cars])

  const filteredBuses = buses.filter(
    (bus) =>
      bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driver.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-lg font-semibold">Bus Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage your fleet</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading buses data. Please try again later.</p>
          </div>
        )}

        {/* Bus List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fleet Overview</CardTitle>
                <CardDescription>Real-time status of all buses</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search buses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
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
                    <TableHead>Bus ID</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="max-w-[200px]">Location</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No buses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.id}</TableCell>
                    <TableCell>{bus.licensePlate}</TableCell>
                    <TableCell>{bus.driver}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <LocationAddress
                          latitude={bus.locationLat}
                          longitude={bus.locationLon}
                          address={bus.location}
                          className="text-sm min-w-0"
                          showLoadingIcon={true}
                          truncate={true}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{bus.speed} km/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bus.status === "ACTIVE" || bus.status === "WORKING" ? "default" : "secondary"}>
                        {bus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/buses/${bus.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
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
      </main>
      {selectedBus && (
        <BusDetailsDialog bus={selectedBus} isOpen={showBusDetails} onClose={() => setShowBusDetails(false)} />
      )}
    </div>
  )
}
