"use client"

import { useState, useEffect } from "react"
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

// Real-time bus tracking data
const liveTrackingData = [
  {
    id: "B-001",
    licensePlate: "ABC-1234",
    driver: "John Smith",
    route: "Route A",
    currentTrip: {
      id: "T-001",
      startTime: "08:30",
      estimatedEnd: "09:45",
      progress: 65,
      currentLocation: "Downtown Terminal",
      nextStop: "Central Mall",
      ticketsSold: 32,
      revenue: 160,
      occupancy: 32,
      capacity: 45,
      speed: 0,
      lastUpdate: "2 min ago",
    },
    status: "active",
    alerts: [],
  },
  {
    id: "B-002",
    licensePlate: "DEF-5678",
    driver: "Sarah Johnson",
    route: "Route B",
    currentTrip: {
      id: "T-002",
      startTime: "08:15",
      estimatedEnd: "09:30",
      progress: 80,
      currentLocation: "Main Street",
      nextStop: "University Campus",
      ticketsSold: 28,
      revenue: 140,
      occupancy: 28,
      capacity: 45,
      speed: 35,
      lastUpdate: "1 min ago",
    },
    status: "active",
    alerts: [],
  },
  {
    id: "B-003",
    licensePlate: "GHI-9012",
    driver: "Mike Wilson",
    route: "Route C",
    currentTrip: {
      id: "T-003",
      startTime: "08:45",
      estimatedEnd: "10:00",
      progress: 45,
      currentLocation: "University Campus",
      nextStop: "Shopping Mall",
      ticketsSold: 41,
      revenue: 205,
      occupancy: 41,
      capacity: 45,
      speed: 25,
      lastUpdate: "30 sec ago",
    },
    status: "active",
    alerts: ["High Occupancy"],
  },
  {
    id: "B-004",
    licensePlate: "JKL-3456",
    driver: "Lisa Brown",
    route: "Route D",
    currentTrip: {
      id: "T-004",
      startTime: "09:00",
      estimatedEnd: "10:15",
      progress: 25,
      currentLocation: "Shopping Mall",
      nextStop: "Hospital",
      ticketsSold: 15,
      revenue: 75,
      occupancy: 15,
      capacity: 45,
      speed: 40,
      lastUpdate: "45 sec ago",
    },
    status: "active",
    alerts: [],
  },
]

type Trip = {
  id: string;
  startTime: string;
  estimatedEnd: string;
  progress: number;
  currentLocation: string;
  nextStop: string;
  ticketsSold: number;
  revenue: number;
  occupancy: number;
  capacity: number;
  speed: number;
  lastUpdate: string;
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
  if (!trip || !bus) return null

  const passengerData = [
    {
      id: "P-001",
      name: "Alice Johnson",
      pickup: "Downtown Terminal",
      dropoff: "Central Mall",
      fare: 5,
      paymentMethod: "Card",
      boardingTime: "08:32",
      hasBoarded: true,
      seatNumber: "A12",
    },
    {
      id: "P-002",
      name: "Bob Wilson",
      pickup: "First Avenue",
      dropoff: "University",
      fare: 7,
      paymentMethod: "Cash",
      boardingTime: "08:35",
      hasBoarded: true,
      seatNumber: "B08",
    },
    {
      id: "P-003",
      name: "Carol Davis",
      pickup: "Second Street",
      dropoff: "Hospital",
      fare: 6,
      paymentMethod: "Mobile",
      boardingTime: "08:38",
      hasBoarded: true,
      seatNumber: "C15",
    },
    {
      id: "P-004",
      name: "David Miller",
      pickup: "Third Avenue",
      dropoff: "Shopping Mall",
      fare: 8,
      paymentMethod: "Card",
      boardingTime: "Expected: 08:45",
      hasBoarded: false,
      seatNumber: "D03",
    },
    {
      id: "P-005",
      name: "Emma Wilson",
      pickup: "Fourth Street",
      dropoff: "Airport",
      fare: 12,
      paymentMethod: "Mobile",
      boardingTime: "Expected: 08:50",
      hasBoarded: false,
      seatNumber: "E07",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trip Details - {trip.id}</DialogTitle>
          <DialogDescription>
            Live passenger information for {bus.id} on {bus.route}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Trip Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trip Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{Math.round(trip.progress)}%</div>
                  <Progress value={trip.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {trip.startTime} - {trip.estimatedEnd}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium">{trip.currentLocation}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Next: {trip.nextStop}</div>
                </div>
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
                    {passengerData.filter((p) => p.hasBoarded).length} boarded,{" "}
                    {passengerData.filter((p) => !p.hasBoarded).length} pending
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
                  <div className="text-2xl font-bold">${trip.revenue}</div>
                  <div className="text-xs text-muted-foreground">{trip.ticketsSold} tickets sold</div>
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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Drop-off Location</TableHead>
                    <TableHead>Boarding Time</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengerData.map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell>
                        <Badge variant={passenger.hasBoarded ? "default" : "secondary"}>
                          {passenger.hasBoarded ? "Boarded" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{passenger.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{passenger.seatNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span className="text-sm">{passenger.pickup}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-red-600" />
                          <span className="text-sm">{passenger.dropoff}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{passenger.boardingTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">${passenger.fare}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            passenger.paymentMethod === "Card"
                              ? "default"
                              : passenger.paymentMethod === "Cash"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {passenger.paymentMethod}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <span>{passengerData.filter((p) => p.paymentMethod === "Card").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash Payments:</span>
                    <span>{passengerData.filter((p) => p.paymentMethod === "Cash").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mobile Payments:</span>
                    <span>{passengerData.filter((p) => p.paymentMethod === "Mobile").length}</span>
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
                    <span className="text-green-600">{passengerData.filter((p) => p.hasBoarded).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="text-yellow-600">{passengerData.filter((p) => !p.hasBoarded).length}</span>
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
                  <div className="flex justify-between text-sm">
                    <span>Speed:</span>
                    <span>{Math.round(trip.speed)} km/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Update:</span>
                    <span>{trip.lastUpdate}</span>
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
  const [buses, setBuses] = useState(liveTrackingData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoute, setSelectedRoute] = useState("all")
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedBusForTrip, setSelectedBusForTrip] = useState<Bus | null>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate real-time updates
      setBuses((prevBuses) =>
        prevBuses.map((bus) => ({
          ...bus,
          currentTrip: {
            ...bus.currentTrip,
            progress: Math.min(100, bus.currentTrip.progress + Math.random() * 5),
            speed: Math.max(0, bus.currentTrip.speed + (Math.random() - 0.5) * 10),
            lastUpdate: "Just now",
          },
        })),
      )
      setLastRefresh(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

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

  const getSpeedColor = (speed: number) => {
    if (speed === 0) return "text-gray-600"
    if (speed > 50) return "text-red-600"
    if (speed > 30) return "text-yellow-600"
    return "text-green-600"
  }

  const manualRefresh = () => {
    setBuses((prevBuses) =>
      prevBuses.map((bus) => ({
        ...bus,
        currentTrip: {
          ...bus.currentTrip,
          lastUpdate: "Just now",
        },
      })),
    )
    setLastRefresh(new Date())
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
            <Badge variant={autoRefresh ? "default" : "secondary"}>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh ? "Disable" : "Enable"} Auto-refresh
            </Button>
            <Button variant="outline" size="sm" onClick={manualRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buses.length}</div>
              <p className="text-xs text-muted-foreground">Currently on routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buses.reduce((acc, bus) => acc + bus.currentTrip.occupancy, 0)}</div>
              <p className="text-xs text-muted-foreground">Across all buses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${buses.reduce((acc, bus) => acc + bus.currentTrip.revenue, 0)}</div>
              <p className="text-xs text-muted-foreground">Current trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buses.reduce((acc, bus) => acc + bus.alerts.length, 0)}</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Fleet Status</CardTitle>
                <CardDescription>Last updated: {lastRefresh.toLocaleTimeString()}</CardDescription>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bus.id}</div>
                        <div className="text-sm text-muted-foreground">{bus.licensePlate}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{bus.driver}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bus.route}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{bus.currentTrip.currentLocation}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Next: {bus.currentTrip.nextStop}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Trip Progress</span>
                          <span>{Math.round(bus.currentTrip.progress)}%</span>
                        </div>
                        <Progress value={bus.currentTrip.progress} className="h-2" />
                      </div>
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
                      <div className={`text-sm font-medium ${getSpeedColor(bus.currentTrip.speed)}`}>
                        {Math.round(bus.currentTrip.speed)} km/h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">${bus.currentTrip.revenue}</div>
                        <div className="text-xs text-muted-foreground">{bus.currentTrip.ticketsSold} tickets</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{bus.currentTrip.lastUpdate}</span>
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
                ))}
              </TableBody>
            </Table>
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
