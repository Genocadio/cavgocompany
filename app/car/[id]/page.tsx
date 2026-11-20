"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBookingSummary, SkeletonTripHistoryList } from "@/components/ui/skeleton-card"
import { ArrowLeft, History, Navigation, Activity, MapIcon, ChevronDown, ChevronUp, Clock, MapPin, DollarSign, Ticket, Loader2, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCompanyCars } from "@/hooks/use-company-cars"
import { useTripsByCar } from "@/hooks/use-trips-by-car"
import { useTripSnapshot } from "@/hooks/use-trip-snapshot"
import { useTripSubscription, type TripSubscriptionData } from "@/hooks/use-trip-subscription"
import { useAuth } from "@/context/auth-context"
import AppHeader from "@/components/app-header"
import { ALL_PACKAGE_STATUSES, useCompanyPackages, type CompanyPackage, type PackageCarrierLeg } from "@/hooks/use-company-packages"

export default function CarManagementPage() {
  const router = useRouter()
  const params = useParams()
  const carId = params?.id as string
  const { user, isLoading: authLoading } = useAuth()
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [bookingTripId, setBookingTripId] = useState<string | null>(null)
  const [liveTripOverrides, setLiveTripOverrides] = useState<Record<string, TripSubscriptionData>>({})

  const isInactiveStatus = (status?: string | null) => {
    if (!status) return false
    const s = status.toLowerCase()
    return s.includes("completed") || s.includes("cancelled")
  }

  const localDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const packageStartDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return localDateString(d)
  }, [])
  const packageEndDate = useMemo(() => localDateString(new Date()), [])

  // Fetch all cars to find the specific one
  const { cars, isLoading: carsLoading } = useCompanyCars({
    companyId: user?.companyId ?? undefined,
    limit: 50,
    offset: 0,
  })

  // Fetch trips for this car
  const { trips, isLoading: tripsLoading, error: tripsError } = useTripsByCar({
    carId,
    enabled: !!carId && !!user?.companyId,
  })

  // Fetch recent company packages (all statuses) to derive per-car and per-trip reports
  const { data: packageActivity, loading: packagesLoading, error: packagesError } = useCompanyPackages({
    companyId: user?.companyId ?? undefined,
    startDate: packageStartDate,
    endDate: packageEndDate,
    statuses: [...ALL_PACKAGE_STATUSES],
  })

  // Merge static trips with live subscription data (keeps latest even after closing card)
  const mergedTrips = useMemo(() => {
    if (!trips || trips.length === 0) return []
    return trips.map((t) => {
      const live = liveTripOverrides[t.id]
      if (!live) return t

      return {
        ...t,
        status: live.status,
        totalDistance: live.totalDistance,
        updatedAt: live.updatedAt,
        createdAt: live.createdAt,
        origin: live.origin,
        destinations: live.destinations,
      }
    })
  }, [trips, liveTripOverrides])

  // Subscribe to live updates for the expanded trip (management mode only)
  const expandedTrip = useMemo(() => mergedTrips.find((t) => t.id === expandedTripId), [mergedTrips, expandedTripId])
  const expandedTripActive = expandedTrip ? !isInactiveStatus(expandedTrip.status) : false

  useTripSubscription({
    tripId: expandedTripId,
    enabled: !!expandedTripId && expandedTripActive,
    onUpdate: (data) => {
      setLiveTripOverrides((prev) => ({ ...prev, [data.id]: data }))
    },
  })

  // Fetch booking snapshot for selected trip
  const bookingTrip = useMemo(() => mergedTrips.find((t) => t.id === bookingTripId), [mergedTrips, bookingTripId])
  const bookingTripActive = bookingTrip ? !isInactiveStatus(bookingTrip.status) : false

  const { snapshot, isLoading: snapshotLoading, error: snapshotError } = useTripSnapshot({
    tripId: bookingTripActive ? bookingTripId : null,
    enabled: !!user?.companyId && !!bookingTripId && bookingTripActive,
  })

  const selectedCar = cars.find(c => c.id === carId)

  const tripIdsForCar = useMemo(() => new Set(mergedTrips.map((t) => String(t.id))), [mergedTrips])

  const latestPackageLeg = (legs: PackageCarrierLeg[]): PackageCarrierLeg | null =>
    legs.reduce<PackageCarrierLeg | null>((latest, leg) => (!latest || leg.linkedAt >= latest.linkedAt ? leg : latest), null)

  const packageForCar = (pkg: CompanyPackage) => {
    if (tripIdsForCar.has(String(pkg.tripId || ""))) return true
    return pkg.carrierLegs.some((leg) => {
      if (leg.vehicleId && String(leg.vehicleId) === String(carId)) return true
      if (leg.tripId && tripIdsForCar.has(String(leg.tripId))) return true
      return false
    })
  }

  const packageForTrip = (pkg: CompanyPackage, tripId: string) => {
    if (String(pkg.tripId || "") === String(tripId)) return true
    return pkg.carrierLegs.some((leg) => String(leg.tripId || "") === String(tripId))
  }

  const carPackages = useMemo(() => {
    if (!carId) return []
    const byGroup = (packageActivity.groups || []).some((g) => g.carId && String(g.carId) === String(carId))
    const pkgs = (packageActivity.packages || []).filter((pkg) => packageForCar(pkg))
    // If groups say this car has packages but enrichment missed, include by group membership hint isn't enough without ids; rely on pkg match.
    return pkgs
  }, [packageActivity, carId, tripIdsForCar])

  const packagesByTripId = useMemo(() => {
    const map = new Map<string, CompanyPackage[]>()
    for (const trip of mergedTrips) {
      map.set(trip.id, carPackages.filter((pkg) => packageForTrip(pkg, trip.id)))
    }
    return map
  }, [carPackages, mergedTrips])

  const activePackageStatuses = new Set<string>([
    "CREATED","ACCEPTED","PICKED_UP","IN_TRANSIT","PENDING_CONFIRMATION","ORIGIN_OFFICE","ASSIGNED_DRIVER","DESTINATION_OFFICE","READY_FOR_COLLECTION",
  ])
  const carInProgressPackages = carPackages.filter((p) => activePackageStatuses.has(String(p.status).toUpperCase())).length

  const humanizePackage = (value: string) => {
    if (!value) return "—"
    return value.split("_").map((p) => p.charAt(0) + p.slice(1).toLowerCase()).join(" ")
  }
  const packageStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    const s = String(status).toUpperCase()
    if (s === "CANCELLED") return "destructive"
    return activePackageStatuses.has(s) ? "default" : "secondary"
  }
  const formatPackageTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return "—"
    return new Date(ms).toLocaleString()
  }

  // Format date helper
  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoDate
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized.includes('active') || normalized.includes('ongoing')) return 'default'
    if (normalized.includes('completed') || normalized.includes('done')) return 'secondary'
    if (normalized.includes('cancelled')) return 'destructive'
    return 'outline'
  }

  // Format remaining distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Format passed time
  const formatPassedTime = (isoDate: string | null | undefined) => {
    if (!isoDate) return null
    try {
      const date = new Date(isoDate)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return null
    }
  }

  // Check if trip is scheduled
  const isTripScheduled = (status: string) => {
    return status.toLowerCase().includes('scheduled') || status.toLowerCase().includes('created')
  }

  // Check if trip is cancelled
  const isTripCancelled = (status: string) => {
    return status.toLowerCase().includes('cancelled')
  }

  // Get location name from snapshot or trip data
  const getLocationName = (locationId: string, type: string, order: number) => {
    // Try to match from trip destinations
    const currentTrip = mergedTrips.find(t => t.id === bookingTripId)
    if (currentTrip) {
      if (type === 'ORIGIN') {
        return currentTrip.origin.addres || 'Origin'
      }
      const dest = currentTrip.destinations.find(d => d.id === locationId)
      if (dest) {
        return dest.addres || `Stop ${order}`
      }
    }
    
    return type === 'ORIGIN' ? 'Origin' : `Stop ${order}`
  }

  if (authLoading || carsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showViewSwitcher={false} />
        <div className="w-full max-w-7xl mx-auto p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedCar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Car not found</p>
        <Button onClick={() => router.push('/')}>Back to Fleet</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showViewSwitcher={false} />
      
      {/* Sub-header with car info */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-mono">{selectedCar.plateNumber}</h1>
              <p className="text-sm text-muted-foreground">Car Management</p>
            </div>
          </div>
          <Badge variant={selectedCar.status === "active" ? "default" : "secondary"} className="capitalize">
            {selectedCar.status}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Trips
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Packages
              {carPackages.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{carPackages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips" className="mt-6 space-y-4">
            {!packagesLoading && carPackages.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-medium">{carPackages.length} package{carPackages.length !== 1 ? "s" : ""}</span>
                    <span className="text-muted-foreground">associated with this car in the last 30 days</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{carInProgressPackages} in progress</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            {tripsLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {tripsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{tripsError}</p>
                </CardContent>
              </Card>
            )}

            {!tripsLoading && !tripsError && mergedTrips.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-12 text-center pb-12">
                  <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No trip history available</p>
                </CardContent>
              </Card>
            )}

            {!tripsLoading && !tripsError && mergedTrips.length > 0 && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {mergedTrips.length} Trip{mergedTrips.length !== 1 ? 's' : ''} Found
                  </p>

                  {mergedTrips.map((trip) => {
                    const isExpanded = expandedTripId === trip.id
                    const isScheduled = isTripScheduled(trip.status)
                    const isCancelled = isTripCancelled(trip.status)
                    const originName = trip.origin.addres || 'Unknown Origin'
                    const finalDestName = trip.destinations[trip.destinations.length - 1]?.addres || 'Unknown Destination'

                    return (
                      <Card key={trip.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-bold mb-2">
                                {originName} → {finalDestName}
                              </CardTitle>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={getStatusColor(trip.status)}>
                                  {trip.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(trip.createdAt)}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {(trip.totalDistance / 1000).toFixed(1)} km
                                </p>
                                {(packagesByTripId.get(trip.id)?.length || 0) > 0 && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="outline" className="gap-1">
                                      <Package className="h-3 w-3" />
                                      {packagesByTripId.get(trip.id)?.length} pkg
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isCancelled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setBookingTripId(trip.id)
                                  }}
                                  className="flex items-center gap-1"
                                  title="View Booking Summary"
                                >
                                  <Ticket className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-0 space-y-3 border-t border-border">
                            <div className="pt-4">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                                All Stops ({trip.destinations.length})
                              </p>
                              
                              <div className="space-y-2">
                                {/* Origin */}
                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate">{originName}</p>
                                          <p className="text-xs text-muted-foreground">Origin</p>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                </div>

                                {/* Destinations/Stops */}
                                {trip.destinations.map((dest, idx) => {
                                  const isPassed = dest.isPassed === true || dest.isPassed === 'true'
                                  const isLastStop = idx === trip.destinations.length - 1

                                  return (
                                    <div 
                                      key={dest.id} 
                                      className={`p-3 rounded-lg border ${
                                        isPassed 
                                          ? 'bg-blue-500/5 border-blue-500/20' 
                                          : 'bg-muted/50 border-border'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div 
                                          className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                                            isLastStop 
                                              ? 'bg-red-500' 
                                              : isPassed 
                                                ? 'bg-blue-500' 
                                                : 'bg-gray-400'
                                          }`} 
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold truncate">{dest.addres}</p>
                                              <p className="text-xs text-muted-foreground">
                                                Stop {dest.index}
                                                {isLastStop && ' • Final Destination'}
                                              </p>
                                            </div>
                                            {dest.fare && (
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                <p className="text-sm font-bold text-emerald-500">
                                                  {dest.fare.toLocaleString()} RWF
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Show passed time or remaining distance based on status and if scheduled */}
                                          {!isScheduled && (
                                            <>
                                              {isPassed && dest.passedTime && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                                                  <Clock className="w-3 h-3" />
                                                  <span>Passed: {formatPassedTime(dest.passedTime)}</span>
                                                </div>
                                              )}
                                              {!isPassed && dest.remainingDistance !== undefined && dest.remainingDistance !== null && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                  <MapPin className="w-3 h-3" />
                                                  <span>Remaining: {formatDistance(dest.remainingDistance)}</span>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Trip Summary */}
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2 bg-muted/30 rounded text-center">
                                    <p className="text-xs text-muted-foreground">Total Stops</p>
                                    <p className="text-lg font-bold">{trip.destinations.length}</p>
                                  </div>
                                  <div className="p-2 bg-muted/30 rounded text-center">
                                    <p className="text-xs text-muted-foreground">Distance</p>
                                    <p className="text-lg font-bold">{(trip.totalDistance / 1000).toFixed(2)} km</p>
                                  </div>
                                </div>
                              </div>

                              {/* Packages for this trip */}
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                  <Package className="h-3.5 w-3.5" /> Packages on this trip ({packagesByTripId.get(trip.id)?.length || 0})
                                </p>
                                {(packagesByTripId.get(trip.id)?.length || 0) === 0 ? (
                                  <p className="text-sm text-muted-foreground">No packages linked to this trip in the last 30 days.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {packagesByTripId.get(trip.id)!.map((pkg) => {
                                      const leg = latestPackageLeg(pkg.carrierLegs)
                                      return (
                                        <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3">
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium">{pkg.trackingCode || pkg.id}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {humanizePackage(pkg.packageOrigin)} · {humanizePackage(pkg.deliveryType)}
                                              {leg?.driverId ? ` · Driver ${leg.driverId}` : ""}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={packageStatusVariant(pkg.status)}>{humanizePackage(pkg.status)}</Badge>
                                            <span className="text-xs text-muted-foreground">{formatPackageTime(pkg.updatedAt || pkg.createdAt)}</span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="packages" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Packages for this car
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Packages associated with this car or its trips over the last 30 days (all statuses). This includes package deliveries, not only passenger bookings/ticketing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {packagesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : packagesError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {packagesError}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">{carPackages.length}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">In progress</p>
                        <p className="text-xl font-bold text-primary">{carInProgressPackages}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-xl font-bold">
                          {carPackages.filter((p) => ["DELIVERED", "COMPLETED"].includes(String(p.status).toUpperCase())).length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Cancelled</p>
                        <p className="text-xl font-bold">
                          {carPackages.filter((p) => String(p.status).toUpperCase() === "CANCELLED").length}
                        </p>
                      </div>
                    </div>

                    {carPackages.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No packages found for this car in the selected period.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tracking</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Origin</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Trip</TableHead>
                              <TableHead>Driver / Vehicle</TableHead>
                              <TableHead>Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...carPackages]
                              .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
                              .map((pkg) => {
                                const leg = latestPackageLeg(pkg.carrierLegs)
                                const tripId = leg?.tripId || pkg.tripId || null
                                return (
                                  <TableRow key={pkg.id}>
                                    <TableCell className="font-medium">{pkg.trackingCode || pkg.id}</TableCell>
                                    <TableCell>
                                      <Badge variant={packageStatusVariant(pkg.status)}>{humanizePackage(pkg.status)}</Badge>
                                    </TableCell>
                                    <TableCell>{humanizePackage(pkg.packageOrigin)}</TableCell>
                                    <TableCell>{humanizePackage(pkg.deliveryType)}</TableCell>
                                    <TableCell>{tripId || "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {leg?.driverId ? `Driver ${leg.driverId}` : "—"}
                                      {leg?.vehicleId ? ` · Vehicle ${leg.vehicleId}` : ""}
                                    </TableCell>
                                    <TableCell className="text-xs">{formatPackageTime(pkg.updatedAt || pkg.createdAt)}</TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Summary Dialog */}
      <Dialog open={!!bookingTripId} onOpenChange={(open) => !open && setBookingTripId(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[80vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-500" />
              Trip Booking Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {snapshotLoading && (
              <SkeletonBookingSummary />
            )}

            {snapshotError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{snapshotError}</p>
              </div>
            )}

            {!snapshotLoading && !snapshotError && snapshot && (
              <>
                {/* Capacity Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Seats</p>
                    <p className="text-2xl font-bold text-emerald-500">{snapshot.capacity.totalSeats}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupied Seats</p>
                    <p className="text-2xl font-bold text-blue-500">{snapshot.capacity.occupiedSeats}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Available</p>
                    <p className="text-2xl font-bold text-green-500">{snapshot.capacity.availableSeats}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pending Payment</p>
                    <p className="text-2xl font-bold text-amber-500">{snapshot.capacity.pendingPaymentSeats}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-500">{snapshot.capacity.totalAmountPaid.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pending Amount</p>
                    <p className="text-2xl font-bold text-red-500">{snapshot.capacity.totalAmountPending.toFixed(2)}</p>
                  </div>
                </div>

                {/* Trip Summary */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-3">Trip Summary</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Tickets</p>
                      <p className="text-lg font-bold">{snapshot.summary.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid Tickets</p>
                      <p className="text-lg font-bold text-green-500">{snapshot.summary.paidTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending Payments</p>
                      <p className="text-lg font-bold text-amber-500">{snapshot.summary.pendingPayments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed Dropoffs</p>
                      <p className="text-lg font-bold text-blue-500">{snapshot.summary.completedDropoffs}</p>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Locations</p>
                  {snapshot.locations.map((location, idx) => (
                    <div
                      key={`${location.locationId}-${idx}`}
                      className="p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            location.type === 'ORIGIN' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-semibold">
                              {getLocationName(location.locationId, location.type, location.order)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {location.type === 'ORIGIN' ? 'Origin' : `Stop ${location.order}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                        {/* Financial Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Pending Amount</p>
                            <p className="text-sm font-bold text-red-500">{location.seats.totalAmountPending.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid Amount</p>
                            <p className="text-sm font-bold text-emerald-500">{location.seats.totalAmountPaid.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {/* Seats Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Pending Seats</p>
                            <p className="text-sm font-bold text-amber-500">{location.seats.pendingPayment}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid Seats</p>
                            <p className="text-sm font-bold text-green-500">{location.seats.pickup}</p>
                          </div>
                        </div>

                        {/* Pickup/Dropoff Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup Seats</p>
                            <p className="text-sm font-bold text-blue-500">{location.seats.pickup}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dropoff Seats</p>
                            <p className="text-sm font-bold text-purple-500">{location.seats.dropoff}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Occupancy Rate */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Occupancy Rate</p>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{
                        width: `${
                          (snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-sm font-bold mt-2">
                    {Math.round(
                      (snapshot.capacity.occupiedSeats / snapshot.capacity.totalSeats) * 100
                    )}%
                  </p>
                </div>
              </>
            )}

            {!snapshotLoading && !snapshotError && !snapshot && (
              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No booking data available for this trip</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
