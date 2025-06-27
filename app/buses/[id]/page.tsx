"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Phone, Clock, CreditCard, Car, MapPin, Fuel, Plus, Edit, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BusDetails, FuelRecord, Trip, FuelFormData, TripFormData } from "@/types"

// Sample detailed bus data with fueling history and upcoming trips
const getBusDetails = (id: string): BusDetails => ({
  id,
  licensePlate: "ABC-1234",
  model: "Mercedes Sprinter 2023",
  capacity: 45,
  driver: {
    name: "John Smith",
    id: "D-001",
    phone: "+1 (555) 123-4567",
    rating: 4.8,
    experience: "5 years",
  },
  currentTrip: {
    id: "T-001",
    route: "Route A",
    startTime: "08:30",
    estimatedEnd: "09:45",
    currentLocation: "Downtown Terminal",
    nextStop: "Central Mall",
    progress: 65,
    ticketsSold: 32,
    revenue: 160,
    passengers: [
      {
        id: "P-001",
        name: "Alice Johnson",
        pickup: "Downtown Terminal",
        dropoff: "Central Mall",
        fare: 5,
        paymentMethod: "Card",
        boardingTime: "08:32",
      },
      {
        id: "P-002",
        name: "Bob Wilson",
        pickup: "First Avenue",
        dropoff: "University",
        fare: 7,
        paymentMethod: "Cash",
        boardingTime: "08:35",
      },
      {
        id: "P-003",
        name: "Carol Davis",
        pickup: "Second Street",
        dropoff: "Hospital",
        fare: 6,
        paymentMethod: "Mobile",
        boardingTime: "08:38",
      },
    ],
  },
  upcomingTrips: [
    {
      id: "T-201",
      route: "Route A",
      scheduledStart: "2024-01-16 10:00",
      scheduledEnd: "2024-01-16 11:15",
      estimatedDuration: "1h 15m",
      status: "scheduled",
      bookedSeats: 28,
      estimatedRevenue: 140,
      revenue: 140,
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
      driver: "John Smith",
    },
    {
      id: "T-202",
      route: "Route A",
      scheduledStart: "2024-01-16 12:30",
      scheduledEnd: "2024-01-16 13:45",
      estimatedDuration: "1h 15m",
      status: "scheduled",
      bookedSeats: 35,
      estimatedRevenue: 175,
      revenue: 175,
      departureLocation: "University Campus",
      arrivalLocation: "Central Terminal",
      driver: "John Smith",
    },
    {
      id: "T-203",
      route: "Route B",
      scheduledStart: "2024-01-16 15:00",
      scheduledEnd: "2024-01-16 16:30",
      estimatedDuration: "1h 30m",
      status: "scheduled",
      bookedSeats: 22,
      estimatedRevenue: 110,
      revenue: 110,
      departureLocation: "Downtown Hub",
      arrivalLocation: "Airport Terminal",
      driver: "Sarah Johnson",
    },
    {
      id: "T-204",
      route: "Route A",
      scheduledStart: "2024-01-16 17:15",
      scheduledEnd: "2024-01-16 18:30",
      estimatedDuration: "1h 15m",
      status: "scheduled",
      bookedSeats: 40,
      estimatedRevenue: 200,
      revenue: 200,
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
      driver: "John Smith",
    },
  ],
  tripHistory: [
    {
      id: "T-100",
      date: "2024-01-15",
      route: "Route A",
      startTime: "06:00",
      endTime: "07:15",
      duration: "1h 15m",
      estimatedDuration: "1h 15m",
      ticketsSold: 28,
      revenue: 140,
      distance: "25 km",
      status: "completed",
      driver: "John Smith",
      fuelUsed: "8.5L",
      averageSpeed: "20 km/h",
      maxOccupancy: 35,
      totalStops: 12,
      scheduledStart: "2024-01-15 06:00",
      scheduledEnd: "2024-01-15 07:15",
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
    },
    {
      id: "T-101",
      date: "2024-01-15",
      route: "Route A",
      startTime: "07:30",
      endTime: "08:45",
      duration: "1h 15m",
      estimatedDuration: "1h 15m",
      ticketsSold: 35,
      revenue: 175,
      distance: "25 km",
      status: "completed",
      driver: "John Smith",
      fuelUsed: "8.2L",
      averageSpeed: "22 km/h",
      maxOccupancy: 42,
      totalStops: 12,
      scheduledStart: "2024-01-15 07:30",
      scheduledEnd: "2024-01-15 08:45",
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
    },
    {
      id: "T-102",
      date: "2024-01-15",
      route: "Route A",
      startTime: "09:00",
      endTime: "10:15",
      duration: "1h 15m",
      estimatedDuration: "1h 15m",
      ticketsSold: 22,
      revenue: 110,
      distance: "25 km",
      status: "completed",
      driver: "John Smith",
      fuelUsed: "8.8L",
      averageSpeed: "18 km/h",
      maxOccupancy: 28,
      totalStops: 12,
      scheduledStart: "2024-01-15 09:00",
      scheduledEnd: "2024-01-15 10:15",
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
    },
    {
      id: "T-103",
      date: "2024-01-14",
      route: "Route A",
      startTime: "06:00",
      endTime: "07:20",
      duration: "1h 20m",
      estimatedDuration: "1h 20m",
      ticketsSold: 31,
      revenue: 155,
      distance: "25 km",
      status: "completed",
      driver: "John Smith",
      fuelUsed: "9.1L",
      averageSpeed: "19 km/h",
      maxOccupancy: 38,
      totalStops: 12,
      scheduledStart: "2024-01-14 06:00",
      scheduledEnd: "2024-01-14 07:20",
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
    },
    {
      id: "T-104",
      date: "2024-01-14",
      route: "Route A",
      startTime: "07:45",
      endTime: "09:00",
      duration: "1h 15m",
      estimatedDuration: "1h 15m",
      ticketsSold: 40,
      revenue: 200,
      distance: "25 km",
      status: "completed",
      driver: "John Smith",
      fuelUsed: "8.0L",
      averageSpeed: "23 km/h",
      maxOccupancy: 45,
      totalStops: 12,
      scheduledStart: "2024-01-14 07:45",
      scheduledEnd: "2024-01-14 09:00",
      departureLocation: "Central Terminal",
      arrivalLocation: "University Campus",
    },
    {
      id: "T-105",
      date: "2024-01-13",
      route: "Route B",
      startTime: "14:00",
      endTime: "15:30",
      duration: "1h 30m",
      estimatedDuration: "1h 30m",
      ticketsSold: 26,
      revenue: 130,
      distance: "30 km",
      status: "completed",
      driver: "Sarah Johnson",
      fuelUsed: "10.2L",
      averageSpeed: "20 km/h",
      maxOccupancy: 32,
      totalStops: 15,
      scheduledStart: "2024-01-13 14:00",
      scheduledEnd: "2024-01-13 15:30",
      departureLocation: "Downtown Hub",
      arrivalLocation: "Airport Terminal",
    },
  ],
  // Enhanced vehicle statistics with fuel tracking
  vehicleStats: {
    totalTrips: 156,
    totalRevenue: 7840,
    totalDistance: "3900 km",
    totalFuelUsed: "1320L",
    totalFuelCost: 1848, // $1.40 per liter average
    averageOccupancy: 68,
    totalDrivingHours: "195h 30m",
    maintenanceHours: "24h",
    downtime: "8h 45m",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-02-10",
    fuelEfficiency: "2.95 km/L", // 3900km / 1320L
    averageFuelCostPerKm: 0.47, // $1848 / 3900km
  },
  todayStats: {
    totalTrips: 4,
    totalRevenue: 640,
    totalPassengers: 117,
    averageOccupancy: 78,
    fuelConsumption: "45L",
    fuelCost: 63, // $1.40 per liter
    distanceCovered: "100 km",
    drivingHours: "5h 15m",
  },
  // Comprehensive fueling history
  fuelingHistory: [
    {
      id: "F-001",
      date: "2024-01-15",
      time: "14:30",
      location: "Shell Station - Downtown",
      driver: "John Smith",
      driverId: "D-001",
      liters: 45.5,
      pricePerLiter: 1.42,
      totalCost: 64.61,
      odometer: 45230,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "SH-789456",
      notes: "Regular refuel after morning shift",
    },
    {
      id: "F-002",
      date: "2024-01-14",
      time: "16:45",
      location: "BP Station - Main Street",
      driver: "John Smith",
      driverId: "D-001",
      liters: 42.8,
      pricePerLiter: 1.38,
      totalCost: 59.06,
      odometer: 45105,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "BP-456123",
      notes: "End of shift refuel",
    },
    {
      id: "F-003",
      date: "2024-01-13",
      time: "08:15",
      location: "Texaco Station - Highway",
      driver: "Sarah Johnson",
      driverId: "D-002",
      liters: 48.2,
      pricePerLiter: 1.45,
      totalCost: 69.89,
      odometer: 44980,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "TX-321789",
      notes: "Pre-shift refuel, tank was low",
    },
    {
      id: "F-004",
      date: "2024-01-12",
      time: "13:20",
      location: "Shell Station - Downtown",
      driver: "John Smith",
      driverId: "D-001",
      liters: 41.3,
      pricePerLiter: 1.4,
      totalCost: 57.82,
      odometer: 44850,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "SH-654987",
      notes: "Mid-day refuel",
    },
    {
      id: "F-005",
      date: "2024-01-11",
      time: "17:30",
      location: "Mobil Station - Airport Road",
      driver: "Mike Wilson",
      driverId: "D-003",
      liters: 46.7,
      pricePerLiter: 1.43,
      totalCost: 66.78,
      odometer: 44720,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "MB-987321",
      notes: "Evening shift refuel",
    },
    {
      id: "F-006",
      date: "2024-01-10",
      time: "09:45",
      location: "BP Station - Main Street",
      driver: "Lisa Brown",
      driverId: "D-004",
      liters: 44.1,
      pricePerLiter: 1.39,
      totalCost: 61.3,
      odometer: 44590,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "BP-147258",
      notes: "Morning refuel before route start",
    },
  ],
})

interface AddFuelRecordDialogProps {
  busId: string
  isOpen: boolean
  onClose: () => void
  onAdd: (record: FuelRecord) => void
}

// Add Fuel Record Dialog Component
function AddFuelRecordDialog({ busId, isOpen, onClose, onAdd }: AddFuelRecordDialogProps) {
  const [fuelData, setFuelData] = useState<FuelFormData>({
    liters: "",
    pricePerLiter: "",
    location: "",
    driver: "",
    odometer: "",
    fuelType: "Diesel",
    paymentMethod: "Company Card",
    receiptNumber: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newRecord: FuelRecord = {
      id: `F-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      location: fuelData.location,
      driver: fuelData.driver,
      driverId: "D-001", // This would come from driver selection
      liters: Number.parseFloat(fuelData.liters),
      pricePerLiter: Number.parseFloat(fuelData.pricePerLiter),
      totalCost: Number.parseFloat(fuelData.liters) * Number.parseFloat(fuelData.pricePerLiter),
      odometer: Number.parseInt(fuelData.odometer),
      fuelType: fuelData.fuelType,
      paymentMethod: fuelData.paymentMethod,
      receiptNumber: fuelData.receiptNumber,
      notes: fuelData.notes,
    }
    onAdd(newRecord)
    setFuelData({
      liters: "",
      pricePerLiter: "",
      location: "",
      driver: "",
      odometer: "",
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "",
      notes: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Fuel Record</DialogTitle>
          <DialogDescription>Record a new fueling transaction for {busId}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="liters">Fuel Amount (Liters)</Label>
              <Input
                id="liters"
                type="number"
                step="0.1"
                value={fuelData.liters}
                onChange={(e) => setFuelData({ ...fuelData, liters: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerLiter">Price per Liter ($)</Label>
              <Input
                id="pricePerLiter"
                type="number"
                step="0.01"
                value={fuelData.pricePerLiter}
                onChange={(e) => setFuelData({ ...fuelData, pricePerLiter: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Gas Station</Label>
              <Input
                id="location"
                value={fuelData.location}
                onChange={(e) => setFuelData({ ...fuelData, location: e.target.value })}
                placeholder="e.g., Shell Station - Downtown"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver Name</Label>
              <Input
                id="driver"
                value={fuelData.driver}
                onChange={(e) => setFuelData({ ...fuelData, driver: e.target.value })}
                placeholder="Driver who refueled"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer Reading</Label>
              <Input
                id="odometer"
                type="number"
                value={fuelData.odometer}
                onChange={(e) => setFuelData({ ...fuelData, odometer: e.target.value })}
                placeholder="Current mileage"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={fuelData.receiptNumber}
                onChange={(e) => setFuelData({ ...fuelData, receiptNumber: e.target.value })}
                placeholder="Receipt/Transaction ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={fuelData.notes}
              onChange={(e) => setFuelData({ ...fuelData, notes: e.target.value })}
              placeholder="Additional notes about this refuel"
            />
          </div>

          {fuelData.liters && fuelData.pricePerLiter && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">
                Total Cost: $
                {(Number.parseFloat(fuelData.liters) * Number.parseFloat(fuelData.pricePerLiter)).toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Fuel Record</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditTripDialogProps {
  trip: Trip | null
  isOpen: boolean
  onClose: () => void
  onSave: (trip: Trip) => void
}

// Edit Trip Dialog Component
function EditTripDialog({ trip, isOpen, onClose, onSave }: EditTripDialogProps) {
  const [tripData, setTripData] = useState<TripFormData>({
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

export default function BusDetailPage() {
  const params = useParams()
  const router = useRouter()
  const busId = params.id as string
  const bus = getBusDetails(busId)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddFuelDialog, setShowAddFuelDialog] = useState(false)
  const [fuelingHistory, setFuelingHistory] = useState<FuelRecord[]>(bus.fuelingHistory)
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>(bus.upcomingTrips)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showEditTripDialog, setShowEditTripDialog] = useState(false)

  const addFuelRecord = (newRecord: FuelRecord) => {
    setFuelingHistory([newRecord, ...fuelingHistory])
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setShowEditTripDialog(true)
  }

  const handleSaveTrip = (updatedTrip: Trip) => {
    setUpcomingTrips(upcomingTrips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)))
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Bus {bus.id} - {bus.licensePlate}
            </h1>
            <p className="text-sm text-muted-foreground">{bus.model}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default">Active</Badge>
            <Button variant="outline" size="sm">
              <Phone className="mr-2 h-4 w-4" />
              Contact Driver
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Trips</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bus.todayStats.totalTrips}</div>
              <p className="text-xs text-muted-foreground">{bus.todayStats.distanceCovered} covered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${bus.todayStats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">{bus.todayStats.totalPassengers} passengers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Fuel Cost</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${bus.todayStats.fuelCost}</div>
              <p className="text-xs text-muted-foreground">{bus.todayStats.fuelConsumption} consumed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bus.vehicleStats.fuelEfficiency}</div>
              <p className="text-xs text-muted-foreground">km per liter</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Trip Alert */}
        {bus.currentTrip && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Current Trip in Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Trip {bus.currentTrip.id}</p>
                  <p className="text-sm text-blue-700">{bus.currentTrip.route}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Current Location</p>
                  <p className="text-sm text-blue-700">{bus.currentTrip.currentLocation}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Next Stop</p>
                  <p className="text-sm text-blue-700">{bus.currentTrip.nextStop}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Trip Progress</span>
                  <span>{bus.currentTrip.progress}%</span>
                </div>
                <Progress value={bus.currentTrip.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live-ticketing">Live Ticketing</TabsTrigger>
            <TabsTrigger value="upcoming-trips">Upcoming Trips</TabsTrigger>
            <TabsTrigger value="trip-history">Trip History</TabsTrigger>
            <TabsTrigger value="fuel-history">Fuel History</TabsTrigger>
            <TabsTrigger value="driver-info">Driver Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Plate:</span>
                    <span className="font-medium">{bus.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{bus.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{bus.capacity} passengers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fuel Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fuel Used:</span>
                    <span className="font-medium">{bus.vehicleStats.totalFuelUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fuel Cost:</span>
                    <span className="font-medium">${bus.vehicleStats.totalFuelCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">{bus.vehicleStats.fuelEfficiency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per KM:</span>
                    <span className="font-medium">${bus.vehicleStats.averageFuelCostPerKm}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="live-ticketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Trip Passengers</CardTitle>
                <CardDescription>Real-time passenger information for Trip {bus.currentTrip.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Passenger</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Drop-off Location</TableHead>
                      <TableHead>Boarding Time</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bus.currentTrip.passengers.map((passenger) => (
                      <TableRow key={passenger.id}>
                        <TableCell className="font-medium">{passenger.name}</TableCell>
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

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${bus.currentTrip.revenue}</div>
                  <p className="text-xs text-muted-foreground">{bus.currentTrip.ticketsSold} tickets sold</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Card:</span>
                      <span>1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cash:</span>
                      <span>1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Mobile:</span>
                      <span>1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Started:</span>
                      <span>{bus.currentTrip.startTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. End:</span>
                      <span>{bus.currentTrip.estimatedEnd}</span>
                    </div>
                    <Badge variant="default">In Progress</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upcoming-trips" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Scheduled Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingTrips.length}</div>
                  <p className="text-xs text-muted-foreground">Today&apos;s remaining trips</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Expected Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${upcomingTrips.reduce((acc, trip) => acc + (trip.estimatedRevenue || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">From upcoming trips</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pre-booked Seats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {upcomingTrips.reduce((acc, trip) => acc + (trip.bookedSeats || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total reservations</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Trips for {bus.id}</CardTitle>
                    <CardDescription>Scheduled trips and their current booking status</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Trip
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Scheduled Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Est. Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
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
                        <TableCell className="text-sm">{trip.driver}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {trip.bookedSeats}/{bus.capacity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trip.bookedSeats ? Math.round((trip.bookedSeats / bus.capacity) * 100) : 0}% full
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">${trip.estimatedRevenue}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTrip(trip)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trip-history" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bus.vehicleStats.totalTrips}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${bus.vehicleStats.totalRevenue}</div>
                  <p className="text-xs text-muted-foreground">All time earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bus.vehicleStats.totalDistance}</div>
                  <p className="text-xs text-muted-foreground">Distance covered</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Driving Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bus.vehicleStats.totalDrivingHours}</div>
                  <p className="text-xs text-muted-foreground">Total operation time</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trip History</CardTitle>
                <CardDescription>Detailed trip records and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Fuel Used</TableHead>
                      <TableHead>Avg Speed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bus.tripHistory.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>{trip.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.route}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{trip.duration}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.startTime} - {trip.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.distance}</TableCell>
                        <TableCell className="text-sm">{trip.driver}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{trip.ticketsSold}</div>
                            <div className="text-xs text-muted-foreground">Max: {trip.maxOccupancy}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">${trip.revenue}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{trip.fuelUsed}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{trip.averageSpeed}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel-history" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Fuel Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bus.vehicleStats.totalFuelUsed}</div>
                  <p className="text-xs text-muted-foreground">All time consumption</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Fuel Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${bus.vehicleStats.totalFuelCost}</div>
                  <p className="text-xs text-muted-foreground">All time expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bus.vehicleStats.fuelEfficiency}</div>
                  <p className="text-xs text-muted-foreground">km per liter</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Cost/km</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${bus.vehicleStats.averageFuelCostPerKm}</div>
                  <p className="text-xs text-muted-foreground">Fuel cost per km</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fueling History</CardTitle>
                    <CardDescription>Complete record of all fuel transactions</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddFuelDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Fuel Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Liters</TableHead>
                      <TableHead>Price/L</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelingHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{record.date}</div>
                            <div className="text-xs text-muted-foreground">{record.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Fuel className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{record.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{record.driver}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{record.liters}L</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">${record.pricePerLiter}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">${record.totalCost.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.odometer.toLocaleString()} km</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {record.receiptNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground max-w-32 truncate">{record.notes || "—"}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="driver-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Driver</CardTitle>
                <CardDescription>Current driver information and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{bus.driver.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver ID:</span>
                      <span className="font-medium">{bus.driver.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{bus.driver.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience:</span>
                      <span className="font-medium">{bus.driver.experience}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{bus.driver.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default">On Duty</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Driver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddFuelRecordDialog
          busId={bus.id}
          isOpen={showAddFuelDialog}
          onClose={() => setShowAddFuelDialog(false)}
          onAdd={addFuelRecord}
        />

        <EditTripDialog
          trip={selectedTrip}
          isOpen={showEditTripDialog}
          onClose={() => setShowEditTripDialog(false)}
          onSave={handleSaveTrip}
        />
      </main>
    </div>
  )
}
