"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, Users, Gauge, MoreHorizontal, Eye, Settings, UserCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Add these imports at the top
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Replace the busData array with this enhanced version:
const busData = [
  {
    id: "B-001",
    licensePlate: "ABC-1234",
    location: "Downtown Terminal",
    occupancy: 32,
    capacity: 45,
    speed: 0,
    status: "active",
    driver: "John Smith",
    driverId: "D-001",
    route: "Route A",
    currentTrip: {
      id: "T-001",
      startTime: "08:30",
      estimatedEnd: "09:45",
      ticketsSold: 32,
      revenue: 160,
      nextStop: "Central Mall",
    },
    totalTripsToday: 4,
    todayRevenue: 640,
  },
  {
    id: "B-002",
    licensePlate: "DEF-5678",
    location: "Main Street",
    occupancy: 28,
    capacity: 45,
    speed: 35,
    status: "active",
    driver: "Sarah Johnson",
    driverId: "D-002",
    route: "Route B",
    currentTrip: {
      id: "T-002",
      startTime: "08:15",
      estimatedEnd: "09:30",
      ticketsSold: 28,
      revenue: 140,
      nextStop: "University Campus",
    },
    totalTripsToday: 3,
    todayRevenue: 420,
  },
  {
    id: "B-003",
    licensePlate: "GHI-9012",
    location: "Maintenance Depot",
    occupancy: 0,
    capacity: 45,
    speed: 0,
    status: "inactive",
    driver: "Not Assigned",
    driverId: "",
    route: "Not Assigned",
    totalTripsToday: 0,
    todayRevenue: 0,
    currentTrip: null,
  },
  {
    id: "B-004",
    licensePlate: "JKL-3456",
    location: "University Campus",
    occupancy: 41,
    capacity: 45,
    speed: 25,
    status: "active",
    driver: "Mike Wilson",
    driverId: "D-003",
    route: "Route C",
    currentTrip: {
      id: "T-003",
      startTime: "08:45",
      estimatedEnd: "10:00",
      ticketsSold: 41,
      revenue: 205,
      nextStop: "City Hospital",
    },
    totalTripsToday: 5,
    todayRevenue: 1025,
  },
  {
    id: "B-005",
    licensePlate: "MNO-7890",
    location: "Shopping Mall",
    occupancy: 15,
    capacity: 45,
    speed: 40,
    status: "active",
    driver: "Lisa Brown",
    driverId: "D-004",
    route: "Route D",
    currentTrip: {
      id: "T-004",
      startTime: "09:00",
      estimatedEnd: "10:15",
      ticketsSold: 15,
      revenue: 75,
      nextStop: "Industrial Park",
    },
    totalTripsToday: 2,
    todayRevenue: 150,
  },
]

// Add these types at the top of the file (after imports):

type DriverType = {
  id: string;
  name: string;
  status: string;
  assignedBus: string;
};

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
                  <span className="text-sm">{bus.location}</span>
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
                <div className="text-2xl font-bold">${bus.todayRevenue}</div>
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
                      <span className="text-sm font-medium">${bus.currentTrip.revenue}</span>
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

// Add this new component for driver assignment:
interface AssignDriverDialogProps {
  bus: Bus;
  drivers: DriverType[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (busId: string, driverId: string) => void;
}

function AssignDriverDialog({ bus, drivers, isOpen, onClose, onAssign }: AssignDriverDialogProps) {
  const [selectedDriver, setSelectedDriver] = useState("")

  const availableDrivers = drivers.filter((d: DriverType) => d.assignedBus === "Not Assigned" || d.assignedBus === bus.id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver to {bus.id}</DialogTitle>
          <DialogDescription>Select a driver to assign to this bus</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Driver</label>
            <div className="p-2 bg-muted rounded">{bus.driver}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Driver</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver: DriverType) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onAssign(bus.id, selectedDriver)
                onClose()
              }}
              disabled={!selectedDriver}
            >
              Assign Driver
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function BusesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [buses, setBuses] = useState(busData)

  // In the main component, add these state variables after the existing ones:
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [showBusDetails, setShowBusDetails] = useState(false)
  const [showAssignDriver, setShowAssignDriver] = useState(false)
  const [drivers] = useState([
    { id: "D-001", name: "John Smith", status: "active", assignedBus: "B-001" },
    { id: "D-002", name: "Sarah Johnson", status: "active", assignedBus: "B-002" },
    { id: "D-003", name: "Mike Wilson", status: "active", assignedBus: "Not Assigned" },
    { id: "D-004", name: "Lisa Brown", status: "active", assignedBus: "Not Assigned" },
  ])

  const filteredBuses = buses.filter(
    (bus) =>
      bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driver.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleBusStatus = (busId: string) => {
    setBuses(
      buses.map((bus) =>
        bus.id === busId ? { ...bus, status: bus.status === "active" ? "inactive" : "active" } : bus,
      ),
    )
  }

  // Add this function to handle driver assignment:
  const assignDriver = (busId: string, driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId)
    setBuses(buses.map((bus) => {
      if (bus.id === busId && driver) {
        return {
          ...bus,
          driver: driver.name,
          driverId: driver.id,
        }
      }
      return bus
    }))
  }

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  const getOccupancyBadge = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100
    if (percentage >= 90) return "destructive"
    if (percentage >= 70) return "secondary"
    return "default"
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Bus Management</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage your fleet</p>
          </div>
          <Button>Add New Bus</Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {buses.filter((b) => b.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {buses.filter((b) => b.status === "inactive").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((buses.reduce((acc, bus) => acc + bus.occupancy / bus.capacity, 0) / buses.length) * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus ID</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.id}</TableCell>
                    <TableCell>{bus.licensePlate}</TableCell>
                    <TableCell>{bus.driver}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{bus.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-sm ${getOccupancyColor(bus.occupancy, bus.capacity)}`}>
                          {bus.occupancy}/{bus.capacity}
                        </span>
                        <Badge variant={getOccupancyBadge(bus.occupancy, bus.capacity)} className="text-xs">
                          {Math.round((bus.occupancy / bus.capacity) * 100)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{bus.speed} km/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={bus.status === "active" ? "default" : "secondary"}>{bus.status}</Badge>
                        <Switch checked={bus.status === "active"} onCheckedChange={() => toggleBusStatus(bus.id)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        {/* In the DropdownMenuContent, replace the existing items with: */}
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/buses/${bus.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBus({ ...bus, currentTrip: bus.currentTrip ?? null })
                              setShowAssignDriver(true)
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      {/* Add these dialogs at the end of the main component, before the closing </div>: */}
      {selectedBus && (
        <>
          <BusDetailsDialog bus={selectedBus} isOpen={showBusDetails} onClose={() => setShowBusDetails(false)} />
          <AssignDriverDialog
            bus={selectedBus}
            drivers={drivers}
            isOpen={showAssignDriver}
            onClose={() => setShowAssignDriver(false)}
            onAssign={assignDriver}
          />
        </>
      )}
    </div>
  )
}
