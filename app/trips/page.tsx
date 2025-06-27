"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Clock, MapPin, Users, CreditCard, Plus, Edit, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Trip } from "@/types"

// Sample trips data
const tripsData: Trip[] = [
  // Upcoming trips
  {
    id: "T-201",
    busId: "B-001",
    licensePlate: "ABC-1234",
    driver: "John Smith",
    route: "Route A",
    scheduledStart: "2024-01-16 06:00",
    scheduledEnd: "2024-01-16 07:15",
    estimatedDuration: "1h 15m",
    status: "scheduled",
    capacity: 45,
    bookedSeats: 28,
    estimatedRevenue: 140,
    revenue: 140,
    departureLocation: "Central Terminal",
    arrivalLocation: "University Campus",
    stops: 12,
  },
  {
    id: "T-202",
    busId: "B-002",
    licensePlate: "DEF-5678",
    driver: "Sarah Johnson",
    route: "Route B",
    scheduledStart: "2024-01-16 07:30",
    scheduledEnd: "2024-01-16 09:00",
    estimatedDuration: "1h 30m",
    status: "scheduled",
    capacity: 45,
    bookedSeats: 35,
    estimatedRevenue: 175,
    revenue: 175,
    departureLocation: "Downtown Hub",
    arrivalLocation: "Airport Terminal",
    stops: 15,
  },
  {
    id: "T-203",
    busId: "B-003",
    licensePlate: "GHI-9012",
    driver: "Mike Wilson",
    route: "Route C",
    scheduledStart: "2024-01-16 08:00",
    scheduledEnd: "2024-01-16 09:30",
    estimatedDuration: "1h 30m",
    status: "scheduled",
    capacity: 45,
    bookedSeats: 22,
    estimatedRevenue: 110,
    revenue: 110,
    departureLocation: "Shopping Mall",
    arrivalLocation: "Business District",
    stops: 10,
  },
  // Ongoing trips
  {
    id: "T-001",
    busId: "B-001",
    licensePlate: "ABC-1234",
    driver: "John Smith",
    route: "Route A",
    scheduledStart: "2024-01-15 08:30",
    scheduledEnd: "2024-01-15 09:45",
    actualStart: "2024-01-15 08:32",
    estimatedDuration: "1h 15m",
    status: "ongoing",
    capacity: 45,
    currentOccupancy: 32,
    revenue: 160,
    progress: 65,
    currentLocation: "Downtown Terminal",
    nextStop: "Central Mall",
    departureLocation: "Central Terminal",
    arrivalLocation: "University Campus",
    stops: 12,
  },
  {
    id: "T-002",
    busId: "B-002",
    licensePlate: "DEF-5678",
    driver: "Sarah Johnson",
    route: "Route B",
    scheduledStart: "2024-01-15 08:15",
    scheduledEnd: "2024-01-15 09:30",
    actualStart: "2024-01-15 08:17",
    estimatedDuration: "1h 15m",
    status: "ongoing",
    capacity: 45,
    currentOccupancy: 28,
    revenue: 140,
    progress: 80,
    currentLocation: "Main Street",
    nextStop: "University Campus",
    departureLocation: "Downtown Hub",
    arrivalLocation: "Airport Terminal",
    stops: 15,
  },
  // Completed trips
  {
    id: "T-100",
    busId: "B-001",
    licensePlate: "ABC-1234",
    driver: "John Smith",
    route: "Route A",
    scheduledStart: "2024-01-15 06:00",
    scheduledEnd: "2024-01-15 07:15",
    actualStart: "2024-01-15 06:02",
    actualEnd: "2024-01-15 07:18",
    estimatedDuration: "1h 16m",
    duration: "1h 16m",
    status: "completed",
    capacity: 45,
    totalPassengers: 28,
    revenue: 140,
    departureLocation: "Central Terminal",
    arrivalLocation: "University Campus",
    stops: 12,
    fuelUsed: "8.5L",
    distance: "25 km",
  },
  {
    id: "T-101",
    busId: "B-002",
    licensePlate: "DEF-5678",
    driver: "Sarah Johnson",
    route: "Route B",
    scheduledStart: "2024-01-15 07:30",
    scheduledEnd: "2024-01-15 09:00",
    actualStart: "2024-01-15 07:28",
    actualEnd: "2024-01-15 08:58",
    estimatedDuration: "1h 30m",
    duration: "1h 30m",
    status: "completed",
    capacity: 45,
    totalPassengers: 35,
    revenue: 175,
    departureLocation: "Downtown Hub",
    arrivalLocation: "Airport Terminal",
    stops: 15,
    fuelUsed: "10.2L",
    distance: "30 km",
  },
]

interface EditTripDialogProps {
  trip: Trip | null
  isOpen: boolean
  onClose: () => void
  onSave: (trip: Trip) => void
}

// Edit Trip Dialog Component
function EditTripDialog({ trip, isOpen, onClose, onSave }: EditTripDialogProps) {
  const [tripData, setTripData] = useState({
    scheduledStart: trip?.scheduledStart || "",
    scheduledEnd: trip?.scheduledEnd || "",
    driver: trip?.driver || "",
    route: trip?.route || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trip) {
      onSave({ ...trip, ...tripData })
      onClose()
    }
  }

  if (!trip) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Trip - {trip.id}</DialogTitle>
          <DialogDescription>Modify trip schedule and details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Scheduled Start</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={tripData.scheduledStart.replace(" ", "T")}
                onChange={(e) => setTripData({ ...tripData, scheduledStart: e.target.value.replace("T", " ") })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">Scheduled End</Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={tripData.scheduledEnd.replace(" ", "T")}
                onChange={(e) => setTripData({ ...tripData, scheduledEnd: e.target.value.replace("T", " ") })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select value={tripData.driver} onValueChange={(value) => setTripData({ ...tripData, driver: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="John Smith">John Smith</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Mike Wilson">Mike Wilson</SelectItem>
                  <SelectItem value="Lisa Brown">Lisa Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select value={tripData.route} onValueChange={(value) => setTripData({ ...tripData, route: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Route A">Route A</SelectItem>
                  <SelectItem value="Route B">Route B</SelectItem>
                  <SelectItem value="Route C">Route C</SelectItem>
                  <SelectItem value="Route D">Route D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>(tripsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoute, setSelectedRoute] = useState("all")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const upcomingTrips = trips.filter((trip) => trip.status === "scheduled")
  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing")
  const completedTrips = trips.filter((trip) => trip.status === "completed")

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
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "ongoing":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setShowEditDialog(true)
  }

  const handleSaveTrip = (updatedTrip: Trip) => {
    setTrips(trips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)))
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Trip Management</h1>
            <p className="text-sm text-muted-foreground">Manage all bus trips - upcoming, ongoing, and completed</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule New Trip
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTrips.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing Trips</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoingTrips.length}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTrips.length}</div>
              <p className="text-xs text-muted-foreground">Finished trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {completedTrips.reduce((acc, trip) => acc + trip.revenue, 0) +
                  ongoingTrips.reduce((acc, trip) => acc + trip.revenue, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Today&apos;s earnings</p>
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    <SelectItem value="Route A">Route A</SelectItem>
                    <SelectItem value="Route B">Route B</SelectItem>
                    <SelectItem value="Route C">Route C</SelectItem>
                    <SelectItem value="Route D">Route D</SelectItem>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Scheduled Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Est. Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTrips(upcomingTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trip.busId}</div>
                            <div className="text-sm text-muted-foreground">{trip.licensePlate}</div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{trip.scheduledStart}</div>
                            <div className="text-xs text-muted-foreground">to {trip.scheduledEnd}</div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.estimatedDuration}</TableCell>
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
                          <div className="text-sm font-medium">${trip.estimatedRevenue}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>Scheduled</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTrip(trip)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="ongoing" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Current Location</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTrips(ongoingTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trip.busId}</div>
                            <div className="text-sm text-muted-foreground">{trip.licensePlate}</div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{trip.progress}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${trip.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{trip.currentLocation}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Next: {trip.nextStop}</div>
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
                          <div className="text-sm font-medium">${trip.revenue}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>Ongoing</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Fuel Used</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTrips(completedTrips).map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trip.busId}</div>
                            <div className="text-sm text-muted-foreground">{trip.licensePlate}</div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{trip.duration}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.actualStart} - {trip.actualEnd}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{trip.totalPassengers}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">${trip.revenue}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{trip.fuelUsed}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{trip.distance}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>Completed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <EditTripDialog
          trip={selectedTrip}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveTrip}
        />
      </main>
    </div>
  )
}
