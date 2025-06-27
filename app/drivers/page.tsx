"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Phone, Mail, MoreHorizontal, Eye, Edit, UserCheck, Clock, CreditCard, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const driverData = [
  {
    id: "D-001",
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
    // Enhanced driving statistics
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
      hireDate: "2022-03-15",
    },
  },
  {
    id: "D-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 234-5678",
    licenseNumber: "DL234567890",
    assignedBus: "B-002",
    status: "active",
    shiftStart: "14:00",
    shiftEnd: "22:00",
    experience: "3 years",
    rating: 4.6,
    avatar: "/placeholder-user.jpg",
    drivingStats: {
      totalDrivingHours: "890h 15m",
      todayHours: "4h 30m",
      weeklyHours: "35h 20m",
      monthlyHours: "142h 10m",
      totalRevenue: 11240,
      todayRevenue: 420,
      weeklyRevenue: 2890,
      monthlyRevenue: 9870,
      totalTrips: 267,
      todayTrips: 3,
      weeklyTrips: 24,
      monthlyTrips: 72,
      totalDistance: "6,720 km",
      averageSpeed: "21 km/h",
      fuelEfficiency: "13.2 km/L",
      onTimePerformance: 91,
      customerRating: 4.6,
      safetyScore: 96,
      lastTripDate: "2024-01-15",
      hireDate: "2021-08-20",
    },
  },
  {
    id: "D-003",
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    phone: "+1 (555) 345-6789",
    licenseNumber: "DL345678901",
    assignedBus: "B-004",
    status: "active",
    shiftStart: "22:00",
    shiftEnd: "06:00",
    experience: "8 years",
    rating: 4.9,
    avatar: "/placeholder-user.jpg",
    drivingStats: {
      totalDrivingHours: "2,180h 45m",
      todayHours: "6h 45m",
      weeklyHours: "42h 15m",
      monthlyHours: "168h 30m",
      totalRevenue: 21890,
      todayRevenue: 1025,
      weeklyRevenue: 4560,
      monthlyRevenue: 16780,
      totalTrips: 498,
      todayTrips: 5,
      weeklyTrips: 35,
      monthlyTrips: 124,
      totalDistance: "12,450 km",
      averageSpeed: "23 km/h",
      fuelEfficiency: "11.8 km/L",
      onTimePerformance: 97,
      customerRating: 4.9,
      safetyScore: 99,
      lastTripDate: "2024-01-15",
      hireDate: "2020-11-05",
    },
  },
  {
    id: "D-004",
    name: "Lisa Brown",
    email: "lisa.brown@email.com",
    phone: "+1 (555) 456-7890",
    licenseNumber: "DL456789012",
    assignedBus: "B-005",
    status: "active",
    shiftStart: "06:00",
    shiftEnd: "14:00",
    experience: "2 years",
    rating: 4.5,
    avatar: "/placeholder-user.jpg",
    drivingStats: {
      totalDrivingHours: "520h 20m",
      todayHours: "3h 15m",
      weeklyHours: "32h 10m",
      monthlyHours: "128h 45m",
      totalRevenue: 6890,
      todayRevenue: 150,
      weeklyRevenue: 1890,
      monthlyRevenue: 5670,
      totalTrips: 156,
      todayTrips: 2,
      weeklyTrips: 18,
      monthlyTrips: 48,
      totalDistance: "3,890 km",
      averageSpeed: "19 km/h",
      fuelEfficiency: "13.8 km/L",
      onTimePerformance: 89,
      customerRating: 4.5,
      safetyScore: 94,
      lastTripDate: "2024-01-15",
      hireDate: "2023-01-10",
    },
  },
  {
    id: "D-005",
    name: "Robert Davis",
    email: "robert.davis@email.com",
    phone: "+1 (555) 567-8901",
    licenseNumber: "DL567890123",
    assignedBus: "Not Assigned",
    status: "inactive",
    shiftStart: "14:00",
    shiftEnd: "22:00",
    experience: "6 years",
    rating: 4.7,
    avatar: "/placeholder-user.jpg",
    drivingStats: {
      totalDrivingHours: "1,680h 10m",
      todayHours: "0h 00m",
      weeklyHours: "0h 00m",
      monthlyHours: "0h 00m",
      totalRevenue: 18450,
      todayRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      totalTrips: 412,
      todayTrips: 0,
      weeklyTrips: 0,
      monthlyTrips: 0,
      totalDistance: "10,240 km",
      averageSpeed: "21 km/h",
      fuelEfficiency: "12.1 km/L",
      onTimePerformance: 92,
      customerRating: 4.7,
      safetyScore: 97,
      lastTripDate: "2024-01-10",
      hireDate: "2020-06-12",
    },
  },
]

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [drivers, setDrivers] = useState(driverData)

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.assignedBus.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleDriverStatus = (driverId: string) => {
    setDrivers(
      drivers.map((driver) =>
        driver.id === driverId ? { ...driver, status: driver.status === "active" ? "inactive" : "active" } : driver,
      ),
    )
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
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Driver Management</h1>
            <p className="text-sm text-muted-foreground">Manage your driver workforce</p>
          </div>
          <Button>Add New Driver</Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {drivers.filter((d) => d.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {drivers.filter((d) => d.status === "inactive").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(drivers.reduce((acc, driver) => acc + driver.rating, 0) / drivers.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Driver Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Driving Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {drivers
                  .reduce((acc, driver) => {
                    const hours = Number.parseFloat(driver.drivingStats.totalDrivingHours.replace(/[^\d.]/g, ""))
                    return acc + hours
                  }, 0)
                  .toFixed(0)}
                h
              </div>
              <p className="text-xs text-muted-foreground">All drivers combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Driver Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${drivers.reduce((acc, driver) => acc + driver.drivingStats.totalRevenue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(drivers.reduce((acc, driver) => acc + driver.drivingStats.safetyScore, 0) / drivers.length).toFixed(
                  1,
                )}
              </div>
              <p className="text-xs text-muted-foreground">Safety performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Driver Directory</CardTitle>
                <CardDescription>Manage driver profiles and assignments</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drivers..."
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Assigned Bus</TableHead>
                  <TableHead>Driving Hours</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={driver.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-muted-foreground">{driver.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{driver.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                    <TableCell>
                      <Badge variant={driver.assignedBus === "Not Assigned" ? "secondary" : "default"}>
                        {driver.assignedBus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{driver.drivingStats.totalDrivingHours}</div>
                        <div className="text-xs text-muted-foreground">Today: {driver.drivingStats.todayHours}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">${driver.drivingStats.totalRevenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Today: ${driver.drivingStats.todayRevenue}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{driver.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={driver.status === "active" ? "default" : "secondary"}>{driver.status}</Badge>
                        <Switch
                          checked={driver.status === "active"}
                          onCheckedChange={() => toggleDriverStatus(driver.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
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
    </div>
  )
}
