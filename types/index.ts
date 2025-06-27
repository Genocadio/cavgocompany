export interface Driver {
  name: string
  id: string
  phone: string
  rating: number
  experience: string
}

export interface Passenger {
  id: string
  name: string
  pickup: string
  dropoff: string
  fare: number
  paymentMethod: "Card" | "Cash" | "Mobile"
  boardingTime: string
}

export interface CurrentTrip {
  id: string
  route: string
  startTime: string
  estimatedEnd: string
  currentLocation: string
  nextStop: string
  progress: number
  ticketsSold: number
  revenue: number
  passengers: Passenger[]
}

export interface Trip {
  id: string
  busId?: string
  licensePlate?: string
  driver: string
  route: string
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
  estimatedDuration: string
  duration?: string
  status: "scheduled" | "ongoing" | "completed"
  capacity?: number
  bookedSeats?: number
  currentOccupancy?: number
  totalPassengers?: number
  estimatedRevenue?: number
  revenue: number
  progress?: number
  currentLocation?: string
  nextStop?: string
  departureLocation: string
  arrivalLocation: string
  stops?: number
  fuelUsed?: string
  distance?: string
  averageSpeed?: string
  maxOccupancy?: number
  totalStops?: number
  date?: string
  startTime?: string
  endTime?: string
  ticketsSold?: number
  driverId?: string
}

export interface VehicleStats {
  totalTrips: number
  totalRevenue: number
  totalDistance: string
  totalFuelUsed: string
  totalFuelCost: number
  averageOccupancy: number
  totalDrivingHours: string
  maintenanceHours: string
  downtime: string
  lastMaintenance: string
  nextMaintenance: string
  fuelEfficiency: string
  averageFuelCostPerKm: number
}

export interface TodayStats {
  totalTrips: number
  totalRevenue: number
  totalPassengers: number
  averageOccupancy: number
  fuelConsumption: string
  fuelCost: number
  distanceCovered: string
  drivingHours: string
}

export interface FuelRecord {
  id: string
  date: string
  time: string
  location: string
  driver: string
  driverId: string
  liters: number
  pricePerLiter: number
  totalCost: number
  odometer: number
  fuelType: string
  paymentMethod: string
  receiptNumber: string
  notes: string
}

export interface BusDetails {
  id: string
  licensePlate: string
  model: string
  capacity: number
  driver: Driver
  currentTrip: CurrentTrip
  upcomingTrips: Trip[]
  tripHistory: Trip[]
  vehicleStats: VehicleStats
  todayStats: TodayStats
  fuelingHistory: FuelRecord[]
}

export interface FuelFormData {
  liters: string
  pricePerLiter: string
  location: string
  driver: string
  odometer: string
  fuelType: string
  paymentMethod: string
  receiptNumber: string
  notes: string
}

export interface TripFormData {
  scheduledStart: string
  scheduledEnd: string
  driver: string
  route: string
}
