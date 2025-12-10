"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Phone, CreditCard, Car, MapPin, Fuel, Edit, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCar } from "@/hooks/use-car"
import { useBookingsByTrip } from "@/hooks/use-bookings-by-trip"
import { useCarMetrics } from "@/hooks/use-car-metrics"
import { LocationAddress } from "@/components/location-address"
import { convertMsToKmh } from "@/lib/utils"
import type { FuelRecord, Trip, FuelFormData, TripFormData } from "@/types"

// Remove dummy getBusDetails function - using real data from GraphQL

interface AddFuelRecordDialogProps {
  busPlate: string
  isOpen: boolean
  onClose: () => void
  onAdd: (record: FuelRecord) => void
}

// Add Fuel Record Dialog Component
function AddFuelRecordDialog({ busPlate, isOpen, onClose, onAdd }: AddFuelRecordDialogProps) {
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
          <DialogDescription>Record a new fueling transaction for {busPlate}</DialogDescription>
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
  
  // Fetch car data
  const { car, loading: carLoading, error: carError } = useCar(busId)
  
  // Get tripId from car data
  const tripId = useMemo(() => car?.latestTrip?.id, [car?.latestTrip?.id])
  
  // Fetch bookings separately when we have tripId
  const { bookings, loading: bookingsLoading } = useBookingsByTrip(tripId)
  
  const displayBookings = bookings || []
  const loading = carLoading || bookingsLoading
  const error = carError
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddFuelDialog, setShowAddFuelDialog] = useState(false)
  const [fuelingHistory, setFuelingHistory] = useState<FuelRecord[]>([]) // Not available in GraphQL response
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]) // Not available in GraphQL response
  const [tripHistory] = useState<Trip[]>([]) // Not available in GraphQL response
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showEditTripDialog, setShowEditTripDialog] = useState(false)
  
  // Car Metrics state
  const [metricsStartDate, setMetricsStartDate] = useState<string | null>(null)
  const [metricsEndDate, setMetricsEndDate] = useState<string | null>(null)
  
  // Calculate default date (today) for metrics
  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }
  
  // Determine which dates to pass to the query
  // Default: today (no dates set) - pass today as startDate, endDate = null (single date)
  // If only startDate is set: pass startDate, endDate = null (single date)
  // If both are set: pass both (range)
  const metricsQueryStartDate = metricsStartDate || getTodayDateString()
  const metricsQueryEndDate = metricsEndDate || null // Only pass endDate if explicitly set
  
  const { metrics: carMetrics, loading: metricsLoading, error: metricsError } = useCarMetrics(
    busId,
    metricsQueryStartDate,
    metricsQueryEndDate
  )

  // If driver is null and activeTab is driver-info, switch to overview
  useEffect(() => {
    if (!car?.currentDriver && activeTab === "driver-info") {
      setActiveTab("overview")
    }
  }, [car?.currentDriver, activeTab])

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

  if (loading) {
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
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    console.error("Error loading bus details:", error)
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading bus details. Please try again later.</p>
            {error.message && <p className="text-xs text-red-600 mt-2">{error.message}</p>}
          </div>
        </main>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">Bus not found. Please check the bus plate and try again.</p>
          </div>
        </main>
      </div>
    )
  }

  // Map car data for display
  const occupancy = 0 // Not available in new structure
  const nextStop = car.latestTrip?.destinations?.find((dest) => !dest.isPassede)?.addres || "N/A"
  const totalDestinations = car.latestTrip?.destinations?.length || 0
  const passedDestinations = car.latestTrip?.destinations?.filter((dest) => dest.isPassede).length || 0
  const progress = totalDestinations > 0 ? Math.round((passedDestinations / totalDestinations) * 100) : 0
  const revenue = car.latestTrip?.destinations?.reduce((sum, dest) => sum + (dest.fare || 0), 0) || 0

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
              Bus {car.plate}
            </h1>
            <p className="text-sm text-muted-foreground">{car.model}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={car.isOnline && (car.status === "ACTIVE" || car.status === "WORKING") ? "default" : "secondary"}>
              {car.status}
            </Badge>
            {car.currentDriver && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${car.currentDriver.phoneNumber}`}>
              <Phone className="mr-2 h-4 w-4" />
              Contact Driver
                </a>
            </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading bus details. Please try again later.</p>
          </div>
        )}
        {/* Quick Stats */}
        <div className={`grid gap-4 ${car.latestTrip ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
          {car.latestTrip && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today&apos;s Trips</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{car.capacity}</div>
                  <p className="text-xs text-muted-foreground">Total seats</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupancy}</div>
                  <p className="text-xs text-muted-foreground">On trip</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Speed</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{convertMsToKmh(car.currentLocation?.speed).toFixed(1)} km/h</div>
              <p className="text-xs text-muted-foreground">
                {car.currentLocation?.location ? (
                  <LocationAddress
                    latitude={car.currentLocation.location.lat}
                    longitude={car.currentLocation.location.lng}
                    address=""
                    className="text-xs"
                    showLoadingIcon={true}
                  />
                ) : (
                  "No location data"
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{car.isOnline ? "Online" : "Offline"}</div>
              <p className="text-xs text-muted-foreground">{car.status}</p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Trip Alert */}
        {car.latestTrip && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Latest Trip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Trip {car.latestTrip.id}</p>
                  <p className="text-sm text-blue-700">
                    {car.latestTrip.origin.addres} → {car.latestTrip.destinations[car.latestTrip.destinations.length - 1]?.addres || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Current Location</p>
                  <p className="text-sm text-blue-700">
                    {car.currentLocation?.location ? (
                      <LocationAddress
                        latitude={car.currentLocation.location.lat}
                        longitude={car.currentLocation.location.lng}
                        address=""
                        className="text-sm"
                        showLoadingIcon={true}
                      />
                    ) : (
                      "No location data"
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Next Stop</p>
                  <p className="text-sm text-blue-700">{nextStop}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Trip Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${car.currentDriver ? "grid-cols-7" : "grid-cols-6"}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live-ticketing">Live Ticketing</TabsTrigger>
            <TabsTrigger value="upcoming-trips">Upcoming Trips</TabsTrigger>
            <TabsTrigger value="trip-history">Trip History</TabsTrigger>
            <TabsTrigger value="fuel-history">Fuel History</TabsTrigger>
            <TabsTrigger value="car-metrics">Car Metrics</TabsTrigger>
            {car.currentDriver && (
              <TabsTrigger value="driver-info">Driver Info</TabsTrigger>
            )}
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
                    <span className="font-medium">{car.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{car.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{car.capacity} passengers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={car.isOnline && (car.status === "ACTIVE" || car.status === "WORKING") ? "default" : "secondary"}>
                      {car.status}
                    </Badge>
                  </div>
                  {car.currentDriver && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver:</span>
                        <span className="font-medium">{car.currentDriver.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver Phone:</span>
                        <span className="font-medium">{car.currentDriver.phoneNumber}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {car.currentLocation?.location ? (
                    <>
                  <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="font-medium">
                          <LocationAddress
                            latitude={car.currentLocation.location.lat}
                            longitude={car.currentLocation.location.lng}
                            address=""
                            className="font-medium"
                            showLoadingIcon={true}
                          />
                        </span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span className="font-medium">{convertMsToKmh(car.currentLocation.speed).toFixed(1)} km/h</span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-muted-foreground">Bearing:</span>
                        <span className="font-medium">{car.currentLocation.bearing}°</span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update:</span>
                        <span className="font-medium">
                          {new Date(car.currentLocation.timestamp).toLocaleString()}
                        </span>
                  </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No location data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="live-ticketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Ticketing - Active Trip Bookings</CardTitle>
                <CardDescription>
                  {car.latestTrip
                    ? `Real-time booking information for Trip ${car.latestTrip.id}`
                    : "No active trip"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {car.latestTrip ? (
                  loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : displayBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No bookings found for this trip</p>
                  ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Drop-off Location</TableHead>
                          <TableHead>Tickets</TableHead>
                      <TableHead>Fare</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {displayBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{booking.customerName}</div>
                                <div className="text-xs text-muted-foreground">{booking.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.phoneNumber}</span>
                              </div>
                            </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                                <span className="text-sm">{booking.pickupLocation.address}</span>
                          </div>
                              {booking.pickupLocation.timestamp && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(booking.pickupLocation.timestamp).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-red-600" />
                                <span className="text-sm">{booking.dropoffLocation.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                              <div className="text-sm font-medium">{booking.numberOfTickets}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {new Intl.NumberFormat("en-RW", {
                                  style: "currency",
                                  currency: "RWF",
                                }).format(booking.fare)}
                          </div>
                        </TableCell>
                        <TableCell>
                              <Badge
                                variant={
                                  booking.paymentMethod === "CARD" || booking.paymentMethod === "Card"
                                    ? "default"
                                    : booking.paymentMethod === "CASH" || booking.paymentMethod === "Cash"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {booking.paymentMethod}
                              </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                                  booking.status === "CONFIRMED" || booking.status === "Confirmed"
                                ? "default"
                                    : booking.status === "PENDING" || booking.status === "Pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                                {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No active trip</p>
                )}
              </CardContent>
            </Card>

            {car.latestTrip && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">{car.latestTrip.destinations.length} destinations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Remaining Seats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">N/A</div>
                    <p className="text-xs text-muted-foreground">Available seats</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Created:</span>
                        <span>
                          {car.latestTrip?.createdAt
                            ? new Date(car.latestTrip.createdAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </span>
                    </div>
                      {car.latestTrip?.updatedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Last Updated:</span>
                          <span>
                            {new Date(car.latestTrip.updatedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                    </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <Badge variant="default">{car.latestTrip?.status || "N/A"}</Badge>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
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
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(upcomingTrips.reduce((acc, trip) => acc + (trip.estimatedRevenue || 0), 0))}
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
                <div>
                  <CardTitle>Upcoming Trips for {car.plate}</CardTitle>
                  <CardDescription>Scheduled trips and their current booking status</CardDescription>
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
                              {trip.bookedSeats}/{car.capacity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trip.bookedSeats ? Math.round((trip.bookedSeats / car.capacity) * 100) : 0}% full
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(trip.estimatedRevenue || 0)}
                          </div>
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
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Driving Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
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
                    {tripHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          No trip history available
                        </TableCell>
                      </TableRow>
                    ) : (
                      tripHistory.map((trip) => (
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
                      ))
                    )}
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
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Fuel Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Cost/km</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Data not available</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Fueling History</CardTitle>
                  <CardDescription>Complete record of all fuel transactions</CardDescription>
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

          <TabsContent value="car-metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Car Metrics</CardTitle>
                    <CardDescription>Performance metrics for this vehicle</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="metrics-start-date" className="text-sm whitespace-nowrap">Start Date:</Label>
                      <Input
                        id="metrics-start-date"
                        type="date"
                        value={metricsStartDate || getTodayDateString()}
                        onChange={(e) => {
                          setMetricsStartDate(e.target.value || null)
                          // If end date is before start date, clear it
                          if (metricsEndDate && e.target.value && metricsEndDate < e.target.value) {
                            setMetricsEndDate(null)
                          }
                        }}
                        className="w-[160px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="metrics-end-date" className="text-sm whitespace-nowrap">End Date (optional):</Label>
                      <Input
                        id="metrics-end-date"
                        type="date"
                        value={metricsEndDate || ""}
                        min={metricsStartDate || undefined}
                        onChange={(e) => setMetricsEndDate(e.target.value || null)}
                        className="w-[160px]"
                        placeholder="Leave empty for single date"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMetricsStartDate(null)
                        setMetricsEndDate(null)
                      }}
                    >
                      Reset to Today
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : metricsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">Error loading car metrics. Please try again later.</p>
                  </div>
                ) : carMetrics ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{carMetrics.totalTrips.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {metricsQueryEndDate 
                            ? `From ${metricsQueryStartDate} to ${metricsQueryEndDate}`
                            : `On ${metricsQueryStartDate}`
                          }
                        </p>
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
                          }).format(carMetrics.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {metricsQueryEndDate 
                            ? `From ${metricsQueryStartDate} to ${metricsQueryEndDate}`
                            : `On ${metricsQueryStartDate}`
                          }
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {((carMetrics.totalDistance || 0) / 1000).toFixed(2)} km
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {metricsQueryEndDate 
                            ? `From ${metricsQueryStartDate} to ${metricsQueryEndDate}`
                            : `On ${metricsQueryStartDate}`
                          }
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No metrics data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {car.currentDriver && (
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
                      <span className="font-medium">{car.currentDriver?.name || "Not Assigned"}</span>
                    </div>
                    {car.currentDriver && (
                      <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver ID:</span>
                          <span className="font-medium">{car.currentDriver.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{car.currentDriver.phoneNumber}</span>
                    </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience:</span>
                      <span className="font-medium">N/A</span>
                    </div>
                  </div>
                  <div className="space-y-3">
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
          )}
        </Tabs>

        <AddFuelRecordDialog
          busPlate={car.plate}
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
