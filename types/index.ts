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
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | string
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

export interface LoginRequestDto {
  emailOrPhone: string
  password: string
}

export enum CompanyUserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  OPERATOR = "OPERATOR",
  VIEWER = "VIEWER",
}

export interface AuthResponseDto {
  accessToken: string
  refreshToken: string
  userId: number
  username: string
  email: string
  phone: string
  userType: string
  isCompanyUser: boolean
  companyId: number | null
  companyName: string | null
  companyUserRole: CompanyUserRole | null
}
// Navigation/Trip API Types
export interface NavigationWaypoint {
  id?: string | null
  name?: string | null
  latitude: number
  longitude: number
}

export interface WaypointProgressDto {
  waypointIndex: number
  waypointId?: string | null
  waypointName?: string | null
  latitude: number
  longitude: number
  state: 'APPROACHING' | 'ARRIVED' | 'DONE'
  arrivedAt?: string | null // ISO 8601
  remainingDistance: number // meters
  remainingTime: number // seconds
}

export interface RouteDto {
  polyline: number[][] // [[lat, lon], ...]
  cumulativeDistances: number[]
  totalDistance: number
  totalDuration: number
  legStopIndices: number[]
  legCumulativeDistances: number[]
  legDurations: number[]
}

export interface NavigationCurrentLocation {
  carId: string
  latitude: number
  longitude: number
  speed: number
  heading?: number | null
  timestamp: string // ISO 8601
}

export interface TripDto {
  id: number
  carId: string
  status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  waypoints: NavigationWaypoint[]
  route?: RouteDto | null
  waypointProgresses: WaypointProgressDto[]
  includeOrigin: boolean
  isCityTrip: boolean
  createdAt: string // ISO 8601
  completedAt?: string | null // ISO 8601
}

export interface TripResponse {
  trip: TripDto
  currentLocation?: NavigationCurrentLocation | null
  instructions?: any | null
}

// Trip Snapshot Types
export interface TripSnapshotCapacity {
  totalSeats: number
  availableSeats: number
  occupiedSeats: number
  pendingPaymentSeats: number
}

export interface TripSnapshotLocationSeats {
  pickup: number
  dropoff: number
  pendingPayment: number
  availableFromHere: number
}

export interface TripSnapshotLocation {
  locationId: string
  addres?: string
  type: 'ORIGIN' | 'DESTINATION'
  order: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
  remainingDistance?: number
  seats: TripSnapshotLocationSeats
}

export interface TripSnapshotSummary {
  totalTickets: number
  paidTickets: number
  pendingPayments: number
  completedDropoffs: number
}

export interface TripSnapshot {
  tripId: string
  tripStatus: string
  lastUpdated: string
  capacity: TripSnapshotCapacity
  locations: TripSnapshotLocation[]
  summary: TripSnapshotSummary
}

// Trips By Car Types
export interface CarTripDestination {
  id: string
  addres: string
  lat: number
  lng: number
  index: number
  fare?: number
  remainingDistance?: number
  isPassede?: boolean
  passedTime?: string
}

export interface CarTripOrigin {
  id: string
  addres: string
  lat: number
  lng: number
}

export interface CarTrip {
  id: string
  createdAt: string
  updatedAt: string
  status: string
  totalDistance: number
  origin: CarTripOrigin
  destinations: CarTripDestination[]
}