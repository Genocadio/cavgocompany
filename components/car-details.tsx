"use client"

import { useState } from "react"
import type { Car, Trip } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Navigation, Activity, History, MapPin, DollarSign } from "lucide-react"

export default function CarDetails({
  car,
  onBack,
}: {
  car: Car
  onBack: () => void
}) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(car.currentTrip || null)
  const [expandedTab, setExpandedTab] = useState<"details" | "bookings">("details")

  const allTrips = car.currentTrip ? [car.currentTrip, ...car.tripHistory] : car.tripHistory

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono">{car.plateNumber}</h1>
            <p className="text-muted-foreground">Fleet ID: {car.id}</p>
          </div>
          <Badge variant={car.status === "active" ? "default" : "secondary"} className="capitalize text-base py-1.5">
            {car.status}
          </Badge>
        </div>
      </div>

      {/* Vehicle Info */}
      <Card className="mb-6 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vehicle Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Speed</p>
              <p className="text-2xl font-bold">{car.speed} km/h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Bearing</p>
              <p className="text-2xl font-bold">{car.bearing}°</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status</p>
              <p className="text-xl font-bold capitalize">{car.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Trips</p>
              <p className="text-2xl font-bold">{allTrips.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6" />
          Trip History
        </h2>

        {allTrips.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No trips recorded
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Trip List */}
            <div className="space-y-3">
              {allTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className={`cursor-pointer transition-all bg-card/50 ${
                    selectedTrip?.id === trip.id
                      ? "border-primary/50 bg-primary/5"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => {
                    setSelectedTrip(trip)
                    setExpandedTab("details")
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="w-4 h-4 text-primary" />
                          <h3 className="font-bold text-lg">{trip.destinationName}</h3>
                          {trip === car.currentTrip && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{trip.distanceKm} km</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <span className="font-bold text-foreground">{trip.bookedSeats}</span> / {trip.totalSeats} seats
                          </span>
                          <span className="text-muted-foreground">
                            Revenue: <span className="font-bold text-foreground">${trip.totalRevenue}</span>
                          </span>
                        </div>
                      </div>
                      {selectedTrip?.id === trip.id && (
                        <div className="text-primary">→</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trip Details */}
            {selectedTrip && (
              <Card className="bg-card/50 border-primary/30">
                <CardHeader>
                  <CardTitle>{selectedTrip.destinationName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={expandedTab} onValueChange={(v) => setExpandedTab(v as "details" | "bookings")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Trip Route</TabsTrigger>
                      <TabsTrigger value="bookings">Bookings & Revenue</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4 space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Start Point</p>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-sm font-mono">[{selectedTrip.start[0]}, {selectedTrip.start[1]}]</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Route Waypoints</p>
                          <div className="space-y-2">
                            {selectedTrip.history.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">No waypoints</p>
                            ) : (
                              selectedTrip.history.map((point, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-muted-foreground font-bold mb-1">Point {idx + 1}</p>
                                    <p className="text-sm font-mono">[{point[0]}, {point[1]}]</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                      {car.currentTrip?.id === selectedTrip.id && car.speed > 0
                                        ? idx < (selectedTrip.history.length * 2) / 3
                                          ? "Passed"
                                          : "Remaining"
                                        : "Planned"}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Destination</p>
                          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <p className="text-sm font-mono">[{selectedTrip.end[0]}, {selectedTrip.end[1]}]</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{selectedTrip.destinationName}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Distance</p>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-lg font-bold">{selectedTrip.distanceKm} km</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bookings" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Seats</p>
                          <p className="text-3xl font-bold text-blue-600">{selectedTrip.totalSeats}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Booked Seats</p>
                          <p className="text-3xl font-bold text-green-600">{selectedTrip.bookedSeats}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Remaining Seats</p>
                        <p className="text-3xl font-bold text-yellow-600">
                          {selectedTrip.totalSeats - selectedTrip.bookedSeats}
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs text-muted-foreground uppercase font-bold">Total Revenue</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">
                          {selectedTrip.currency || "USD"} {selectedTrip.totalRevenue.toLocaleString()}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-3">Occupancy Rate</p>
                        <div className="w-full bg-border rounded-full h-3 overflow-hidden mb-2">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{
                              width: `${(selectedTrip.bookedSeats / selectedTrip.totalSeats) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm font-bold">
                          {Math.round((selectedTrip.bookedSeats / selectedTrip.totalSeats) * 100)}%
                        </p>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Revenue Per Seat</p>
                        <p className="text-2xl font-bold">
                          {selectedTrip.currency || "USD"}{" "}
                          {(selectedTrip.totalRevenue / selectedTrip.bookedSeats).toFixed(2)}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
