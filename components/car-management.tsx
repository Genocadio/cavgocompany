"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Car } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, MapIcon, Navigation, Activity, ArrowRight, Search, SlidersHorizontal, X, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    // For older timestamps, show the actual date/time
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

const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return null
  try {
    const date = new Date(timestamp)
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

const formatKm = (km?: number) => {
  if (km == null) return null
  const val = Math.max(0, km)
  if (val >= 1) return `${val.toFixed(1)} km`
  return `${Math.round(val * 1000)} m`
}

export default function CarManagement({
  cars,
  onSelectCar,
  onViewOnMap,
  onViewDetails,
  onViewTrip,
}: {
  cars: Car[]
  onSelectCar: (car: Car) => void
  onViewOnMap?: (car: Car) => void
  onViewDetails?: (car: Car) => void
  onViewTrip?: (car: Car, trip: Car["currentTrip"]) => void
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterTripsOnly, setFilterTripsOnly] = useState(false)
  const [filterNoTrips, setFilterNoTrips] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filteredCars = useMemo(() => {
    let result = cars

    if (filterTripsOnly) {
      result = result.filter((car) => car.currentTrip)
    }

    if (filterNoTrips) {
      result = result.filter((car) => !car.currentTrip)
    }

    return result
  }, [cars, filterTripsOnly, filterNoTrips])

  const sortedCars = useMemo(() => {
    if (!searchQuery.trim()) return filteredCars

    const query = searchQuery.toLowerCase()
    const matching = filteredCars.filter((car) => car.plateNumber.toLowerCase().includes(query))
    const notMatching = filteredCars.filter((car) => !car.plateNumber.toLowerCase().includes(query))

    return [...matching, ...notMatching]
  }, [filteredCars, searchQuery])

  const matchingCarIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()

    const query = searchQuery.toLowerCase()
    return new Set(
      filteredCars.filter((car) => car.plateNumber.toLowerCase().includes(query)).map((car) => car.id)
    )
  }, [filteredCars, searchQuery])

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          {!filtersOpen && (
            <button
              onClick={() => setFiltersOpen(true)}
              className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all relative"
              title="Filter cars"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {(filterTripsOnly || filterNoTrips) && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" aria-hidden="true" />
              )}
            </button>
          )}

          {filtersOpen && (
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg shadow-lg p-2">
              <Button
                variant={filterTripsOnly ? "default" : "outline"}
                size="sm"
                className={filterTripsOnly ? "bg-primary text-primary-foreground" : ""}
                onClick={() => {
                  setFilterTripsOnly((prev) => !prev)
                  setFilterNoTrips(false)
                }}
              >
                With Trips
              </Button>
              <Button
                variant={filterNoTrips ? "default" : "outline"}
                size="sm"
                className={filterNoTrips ? "bg-primary text-primary-foreground" : ""}
                onClick={() => {
                  setFilterNoTrips((prev) => !prev)
                  setFilterTripsOnly(false)
                }}
              >
                No Trips
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setFiltersOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {!searchOpen && (
        <button
          onClick={() => setSearchOpen(true)}
          className="absolute top-6 right-6 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
          title="Search cars by plate number"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {searchOpen && (
        <div className="absolute top-6 right-6 z-40 flex gap-2 bg-background border border-border rounded-lg shadow-lg p-2">
          <Input
            placeholder="Search plate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 border-0 bg-transparent focus:ring-0"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSearchOpen(false)
              setSearchQuery("")
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-full">
        {sortedCars.map((car) => (
          <Card
            key={car.id}
            className={`group transition-all cursor-pointer bg-card/50 ${
              matchingCarIds.has(car.id)
                ? "border-primary border-2 bg-primary/5 ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => router.push(`/car/${car.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold font-mono">{car.plateNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* GPS Warning or Timestamp */}
              {!car.gpsTimestamp ? (
                <div className="mb-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">No GPS data sent</p>
                </div>
              ) : (
                <div 
                  className="mb-3 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 group/gps relative"
                  title={`GPS data received: ${formatTimestamp(car.gpsTimestamp)}`}
                >
                  <Navigation className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    GPS active • {formatTimestamp(car.gpsTimestamp)}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <div className="bg-muted p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Speed / Bearing</p>
                  <p className="font-semibold">
                    {car.speed} km/h • {car.bearing}°
                  </p>
                </div>
              </div>

              {car.currentTrip ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewTrip?.(car, car.currentTrip)
                  }}
                  className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase">Current Trip</span>
                    <Navigation className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium truncate">
                    {(car.currentTrip.originName || 'Origin')} → {car.currentTrip.destinationName || 'Destination'}
                  </p>
                  {(() => {
                    const status = (car.currentTrip?.status || '').toLowerCase()
                    const isScheduled = status.includes('scheduled') || status.includes('created')
                    const isInProgress = status.includes('in_progress')

                    if (isScheduled) {
                      return (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          <div className="font-semibold">Departure Time</div>
                          <div>{formatDateTime(car.currentTrip.createdAt) || 'Not set'}</div>
                        </div>
                      )
                    }

                    if (isInProgress && car.currentTrip.totalDistanceKm && car.currentTrip.totalDistanceKm > 0) {
                      const remaining = Math.max(0, car.currentTrip.distanceKm || 0)
                      const nextStop = car.currentTrip.nextStopName || car.currentTrip.destinationName
                      return (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          <div className="font-semibold text-emerald-600">Remaining</div>
                          <div>
                            {formatKm(remaining)}
                            {nextStop ? ` to ${nextStop}` : ''}
                          </div>
                        </div>
                      )
                    }

                    return null
                  })()}
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <History className="w-4 h-4" />
                    No active trip
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewOnMap?.(car)
                  }}
                  disabled={
                    // Disable when no valid location and no active trip
                    (!car.position || car.position[0] === 0 || car.position[1] === 0) &&
                    !car.currentTrip &&
                    !(car as any).activeTripId
                  }
                  className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  <MapIcon className="w-4 h-4" />
                  View on Map
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
