"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Phone, Mail, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { useCompanyDrivers } from "@/hooks/use-company-drivers"
import type { CompanyDriver } from "@/lib/graphql/types"

// Remove dummy driverData - using real data from GraphQL

export default function DriversPage() {
  const { user } = useAuth()
  const { drivers: graphqlDrivers, loading, error } = useCompanyDrivers(user?.companyId)
  const [searchTerm, setSearchTerm] = useState("")

  // Map GraphQL drivers to display format
  const drivers = useMemo(() => {
    return graphqlDrivers.map((driver: CompanyDriver) => {
      const latestTripRevenue = driver.latestTrip?.destinations?.reduce((sum, dest) => sum + (dest.fare || 0), 0) || 0
      const latestTripDistance = driver.latestTrip?.destinations?.reduce((sum, dest) => sum + (dest.remainingDistance || 0), 0) || 0
      const latestTripRoute = driver.latestTrip
        ? `${driver.latestTrip.origin.addres} → ${driver.latestTrip.destinations[driver.latestTrip.destinations.length - 1]?.addres || "N/A"}`
        : "No trip"
      
      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phoneNumber,
        licenseNumber: "N/A", // Not available in new structure
        assignedBus: driver.currentCar?.plate || "Not Assigned",
        status: driver.status || (driver.currentCar ? "active" : "inactive"),
        totalTrips: 0, // Not available in new structure
        totalRevenue: latestTripRevenue,
        totalDistance: latestTripDistance,
        lastTripTimestamp: driver.latestTrip?.destinations?.find(d => d.passedTime)?.passedTime || null,
        latestTripRoute: latestTripRoute,
      }
    })
  }, [graphqlDrivers])

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.assignedBus.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeDrivers = drivers.filter((d) => d.status === "active").length
  const inactiveDrivers = drivers.filter((d) => d.status === "inactive").length

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
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading drivers data. Please try again later.</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{drivers.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{activeDrivers}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-600">{inactiveDrivers}</div>
              )}
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
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Assigned Bus</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No drivers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{driver.name}</div>
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
                        <TableCell>
                          <Badge variant={driver.assignedBus === "Not Assigned" ? "secondary" : "default"}>
                            {driver.assignedBus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-RW", {
                              style: "currency",
                              currency: "RWF",
                            }).format(driver.totalRevenue)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.status === "active" ? "default" : "secondary"}>{driver.status}</Badge>
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
    </div>
  )
}
