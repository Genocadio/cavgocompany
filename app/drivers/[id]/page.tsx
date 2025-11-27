"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Phone, Mail, Clock, CreditCard, Shield, Award, MapPin, Fuel } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Sample detailed driver data with fueling history
const getDriverDetails = (id: string) => ({
  id,
  name: "John Smith",
  email: "john.smith@email.com",
  phone: "+1 (555) 123-4567",
  licenseNumber: "DL123456789",
  assignedBus: "B-001",
  status: "active",
  shiftStart: "06:00",
  shiftEnd: "14:00",
  experience: "5 years",
  rating: 4.8,
  avatar: "/placeholder-user.jpg",
  hireDate: "2022-03-15",
  address: "123 Main Street, City, State 12345",
  emergencyContact: {
    name: "Jane Smith",
    phone: "+1 (555) 987-6543",
    relationship: "Spouse",
  },
  // Comprehensive driving statistics with fuel tracking
  drivingStats: {
    totalDrivingHours: "1,240h 30m",
    todayHours: "5h 15m",
    weeklyHours: "38h 45m",
    monthlyHours: "156h 20m",
    totalRevenue: 15680,
    todayRevenue: 640,
    weeklyRevenue: 3420,
    monthlyRevenue: 12450,
    totalTrips: 342,
    todayTrips: 4,
    weeklyTrips: 28,
    monthlyTrips: 89,
    totalDistance: "8,540 km",
    averageSpeed: "22 km/h",
    fuelEfficiency: "12.5 km/L",
    onTimePerformance: 94,
    customerRating: 4.8,
    safetyScore: 98,
    lastTripDate: "2024-01-15",
    // Enhanced fuel statistics
    totalFuelUsed: "683L",
    totalFuelCost: 956.2,
    averageFuelCostPerTrip: 2.79,
    fuelCostPerKm: 0.11,
  },
  // Detailed trip history
  tripHistory: [
    {
      id: "T-001",
      date: "2024-01-15",
      bus: "B-001",
      route: "Route A",
      startTime: "08:30",
      endTime: "09:45",
      duration: "1h 15m",
      distance: "25 km",
      ticketsSold: 32,
      revenue: 160,
      fuelUsed: "8.5L",
      averageSpeed: "20 km/h",
      maxOccupancy: 35,
      status: "completed",
    },
    {
      id: "T-002",
      date: "2024-01-15",
      bus: "B-001",
      route: "Route A",
      startTime: "07:00",
      endTime: "08:15",
      duration: "1h 15m",
      distance: "25 km",
      ticketsSold: 28,
      revenue: 140,
      fuelUsed: "8.2L",
      averageSpeed: "22 km/h",
      maxOccupancy: 32,
      status: "completed",
    },
    {
      id: "T-003",
      date: "2024-01-15",
      bus: "B-001",
      route: "Route A",
      startTime: "06:00",
      endTime: "07:00",
      duration: "1h 00m",
      distance: "25 km",
      ticketsSold: 35,
      revenue: 175,
      fuelUsed: "7.8L",
      averageSpeed: "25 km/h",
      maxOccupancy: 40,
      status: "completed",
    },
    {
      id: "T-004",
      date: "2024-01-14",
      bus: "B-001",
      route: "Route A",
      startTime: "13:30",
      endTime: "14:45",
      duration: "1h 15m",
      distance: "25 km",
      ticketsSold: 22,
      revenue: 110,
      fuelUsed: "8.8L",
      averageSpeed: "18 km/h",
      maxOccupancy: 28,
      status: "completed",
    },
    {
      id: "T-005",
      date: "2024-01-14",
      bus: "B-001",
      route: "Route A",
      startTime: "12:00",
      endTime: "13:20",
      duration: "1h 20m",
      distance: "25 km",
      ticketsSold: 31,
      revenue: 155,
      fuelUsed: "9.1L",
      averageSpeed: "19 km/h",
      maxOccupancy: 38,
      status: "completed",
    },
  ],
  // Performance metrics
  performanceMetrics: {
    punctuality: 94,
    customerSatisfaction: 4.8,
    fuelEfficiency: 12.5,
    safetyRecord: 98,
    revenuePerHour: 45.2,
    tripsPerDay: 4.2,
    averageOccupancy: 68,
  },
  // Recent achievements
  achievements: [
    { title: "Safety Champion", description: "No incidents for 6 months", date: "2024-01-01" },
    { title: "Top Revenue Driver", description: "Highest monthly revenue", date: "2023-12-31" },
    { title: "Customer Favorite", description: "4.8+ rating for 3 months", date: "2023-11-15" },
    { title: "Fuel Efficiency Expert", description: "Best fuel economy this quarter", date: "2023-12-31" },
  ],
  // Driver's fueling history
  fuelingHistory: [
    {
      id: "F-001",
      date: "2024-01-15",
      time: "14:30",
      bus: "B-001",
      location: "Shell Station - Downtown",
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
      bus: "B-001",
      location: "BP Station - Main Street",
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
      date: "2024-01-12",
      time: "13:20",
      bus: "B-001",
      location: "Shell Station - Downtown",
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
      id: "F-004",
      date: "2024-01-10",
      time: "09:45",
      bus: "B-001",
      location: "BP Station - Main Street",
      liters: 44.1,
      pricePerLiter: 1.39,
      totalCost: 61.3,
      odometer: 44590,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "BP-147258",
      notes: "Morning refuel before route start",
    },
    {
      id: "F-005",
      date: "2024-01-08",
      time: "15:15",
      bus: "B-001",
      location: "Texaco Station - Highway",
      liters: 47.2,
      pricePerLiter: 1.41,
      totalCost: 66.55,
      odometer: 44460,
      fuelType: "Diesel",
      paymentMethod: "Company Card",
      receiptNumber: "TX-852741",
      notes: "Highway refuel during long route",
    },
  ],
})

interface FuelRecord {
  id: string;
  date: string;
  time: string;
  bus: string;
  location: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  fuelType: string;
  paymentMethod: string;
  receiptNumber: string;
  notes: string;
}

interface AddDriverFuelRecordDialogProps {
  driverId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: FuelRecord) => void;
}

function AddDriverFuelRecordDialog({ driverId, isOpen, onClose, onAdd }: AddDriverFuelRecordDialogProps) {
  const [fuelData, setFuelData] = useState({
    liters: "",
    pricePerLiter: "",
    location: "",
    bus: "",
    odometer: "",
    fuelType: "Diesel",
    paymentMethod: "Company Card",
    receiptNumber: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newRecord = {
      id: `F-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      bus: fuelData.bus,
      location: fuelData.location,
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
      bus: "",
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
          <DialogDescription>Record a new fueling transaction for driver {driverId}</DialogDescription>
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
              <Label htmlFor="bus">Bus ID</Label>
              <Input
                id="bus"
                value={fuelData.bus}
                onChange={(e) => setFuelData({ ...fuelData, bus: e.target.value })}
                placeholder="e.g., B-001"
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

export default function DriverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const driverId = params.id as string
  const driver = getDriverDetails(driverId)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddFuelDialog, setShowAddFuelDialog] = useState(false)
  const [fuelingHistory, setFuelingHistory] = useState(driver.fuelingHistory)

  const addFuelRecord = (newRecord: FuelRecord) => {
    setFuelingHistory([newRecord, ...fuelingHistory])
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
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
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={driver.avatar || "/placeholder.svg"} />
              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold">{driver.name}</h1>
              <p className="text-sm text-muted-foreground">Driver ID: {driver.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={driver.status === "active" ? "default" : "secondary"}>{driver.status}</Badge>
            <Button variant="outline" size="sm">
              <Phone className="mr-2 h-4 w-4" />
              Call Driver
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Key Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Driving Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driver.drivingStats.totalDrivingHours}</div>
              <p className="text-xs text-muted-foreground">Today: {driver.drivingStats.todayHours}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-RW", {
                  style: "currency",
                  currency: "RWF",
                }).format(driver.drivingStats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today: {new Intl.NumberFormat("en-RW", {
                  style: "currency",
                  currency: "RWF",
                }).format(driver.drivingStats.todayRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Expenses</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(driver.drivingStats.totalFuelCost)}
                  </div>
              <p className="text-xs text-muted-foreground">{driver.drivingStats.totalFuelUsed} consumed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driver.drivingStats.safetyScore}%</div>
              <p className="text-xs text-muted-foreground">Rating: {driver.rating}★</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Assigned Bus</p>
                <p className="text-sm text-blue-700">{driver.assignedBus}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Shift Hours</p>
                <p className="text-sm text-blue-700">
                  {driver.shiftStart} - {driver.shiftEnd}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Today&apos;s Hours</p>
                <p className="text-sm text-blue-700">{driver.drivingStats.todayHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="driving-stats">Driving Stats</TabsTrigger>
            <TabsTrigger value="trip-history">Trip History</TabsTrigger>
            <TabsTrigger value="fuel-history">Fuel History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number:</span>
                    <span className="font-medium">{driver.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{driver.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hire Date:</span>
                    <span className="font-medium">{driver.hireDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={driver.status === "active" ? "default" : "secondary"}>{driver.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {driver.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Award className="h-4 w-4 text-yellow-500 mt-1" />
                      <div>
                        <div className="font-medium text-sm">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                        <div className="text-xs text-muted-foreground">{achievement.date}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="driving-stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Driving Hours Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Hours:</span>
                    <span className="font-medium">{driver.drivingStats.totalDrivingHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Hours:</span>
                    <span className="font-medium">{driver.drivingStats.monthlyHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Hours:</span>
                    <span className="font-medium">{driver.drivingStats.weeklyHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today&apos;s Hours:</span>
                    <span className="font-medium">{driver.drivingStats.todayHours}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Revenue:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.monthlyRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Revenue:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.weeklyRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today&apos;s Revenue:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.todayRevenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fuel Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fuel Used:</span>
                    <span className="font-medium">{driver.drivingStats.totalFuelUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fuel Cost:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.totalFuelCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per Trip:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.averageFuelCostPerTrip)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per KM:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.drivingStats.fuelCostPerKm)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Additional Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Distance:</span>
                      <span className="font-medium">{driver.drivingStats.totalDistance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Speed:</span>
                      <span className="font-medium">{driver.drivingStats.averageSpeed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Efficiency:</span>
                      <span className="font-medium">{driver.drivingStats.fuelEfficiency}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">On-Time Performance:</span>
                      <span className="font-medium">{driver.drivingStats.onTimePerformance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Rating:</span>
                      <span className="font-medium">{driver.drivingStats.customerRating}★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Safety Score:</span>
                      <span className="font-medium">{driver.drivingStats.safetyScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trip-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
                <CardDescription>Detailed history of completed trips</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Passengers</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Fuel Used</TableHead>
                      <TableHead>Avg Speed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driver.tripHistory.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>{trip.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.bus}</Badge>
                        </TableCell>
                        <TableCell>{trip.route}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{trip.duration}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.startTime} - {trip.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.distance}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{trip.ticketsSold}</div>
                            <div className="text-xs text-muted-foreground">Max: {trip.maxOccupancy}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(trip.revenue)}
                          </div>
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
                  <div className="text-2xl font-bold">{driver.drivingStats.totalFuelUsed}</div>
                  <p className="text-xs text-muted-foreground">All time consumption</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Fuel Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(driver.drivingStats.totalFuelCost)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Cost per Trip</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(driver.drivingStats.averageFuelCostPerTrip)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per trip average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driver.drivingStats.fuelEfficiency}</div>
                  <p className="text-xs text-muted-foreground">km per liter</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Driver&apos;s Fueling History</CardTitle>
                  <CardDescription>Complete record of fuel transactions by this driver</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Location</TableHead>
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
                          <Badge variant="outline">{record.bus}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Fuel className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{record.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{record.liters}L</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(record.pricePerLiter)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(record.totalCost)}
                          </div>
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

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Punctuality</span>
                      <span>{driver.performanceMetrics.punctuality}%</span>
                    </div>
                    <Progress value={driver.performanceMetrics.punctuality} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Safety Record</span>
                      <span>{driver.performanceMetrics.safetyRecord}%</span>
                    </div>
                    <Progress value={driver.performanceMetrics.safetyRecord} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Customer Satisfaction</span>
                      <span>{driver.performanceMetrics.customerSatisfaction}/5.0</span>
                    </div>
                    <Progress value={(driver.performanceMetrics.customerSatisfaction / 5) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Occupancy</span>
                      <span>{driver.performanceMetrics.averageOccupancy}%</span>
                    </div>
                    <Progress value={driver.performanceMetrics.averageOccupancy} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue per Hour:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(driver.performanceMetrics.revenuePerHour)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trips per Day:</span>
                    <span className="font-medium">{driver.performanceMetrics.tripsPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">{driver.performanceMetrics.fuelEfficiency} km/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Rating:</span>
                    <span className="font-medium">{driver.performanceMetrics.customerSatisfaction}★</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.address}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{driver.emergencyContact.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{driver.emergencyContact.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relationship:</span>
                    <span className="font-medium">{driver.emergencyContact.relationship}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <AddDriverFuelRecordDialog
          driverId={driver.id}
          isOpen={showAddFuelDialog}
          onClose={() => setShowAddFuelDialog(false)}
          onAdd={addFuelRecord}
        />
      </main>
    </div>
  )
}
