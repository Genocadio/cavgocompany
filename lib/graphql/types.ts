export interface CompanyDashboard {
  activeCars: number
  averageRating: number
  companyCode: string
  companyId: string
  companyName: string
  offlineCars: number
  pendingBookings: number
  totalBookings: number
  totalCars: number
  totalDrivers: number
  totalRevenueToday: number
}

export interface GetCompanyDashboardResponse {
  getCompanyDashboard: CompanyDashboard
}

export interface GetCompanyDashboardVariables {
  companyId: string
}

export interface CurrentLocation {
  address: string
  bearing: number
  latitude: number
  longitude: number
  speed: number
  timestamp: string
}

export interface Driver {
  id?: string
  name: string
  phone: string
  email?: string
  licenseNumber?: string
}

export interface LocationPoint {
  placename: string
  passedTimestamp?: string | null
  remainingDistance?: number | null
  passed: boolean
  longitude: number
  latitude: number
  fare?: number | null
}

export interface ActiveTrip {
  remainingSeats: number
  startTime: string
  status: string
  waypoints: LocationPoint[]
  origin: LocationPoint
  id: string
  endTime?: string | null
  distance: number
  destination: LocationPoint
  departureTime: string
}

export interface Car {
  currentLocation: CurrentLocation | null
  driver: Driver | null
  id: string
  operationalStatus: string
  plate: string
  capacity: number
  make: string
  model: string
  isOnline: boolean
  latestTripCompletionTime?: string | null
  activeTrip: ActiveTrip | null
  lastUpdated?: string | null
  connectionStatus?: string | null
}

export interface GetCarsByCompanyResponse {
  getCarsByCompany: Car[]
}

export interface GetCarsByCompanyVariables {
  companyId: string
}

export interface GetCarVariables {
  getCarId: string
  carId: string
}

export interface GetBookingsByTripVariables {
  tripId: string
}

export interface GetBookingsByTripResponse {
  getBookingsByTrip: Booking[]
}

export interface TripOrigin {
  placename?: string
  passedTimestamp?: string | null
  passed?: boolean
  longitude?: number
  latitude?: number
}

export interface BookingLocation {
  longitude: number
  latitude: number
  address: string
  timestamp?: string | null
}

export interface Booking {
  customerName: string
  dropoffLocation: BookingLocation
  email: string
  fare: number
  id: string
  numberOfTickets: number
  paymentMethod: string
  pickupLocation: BookingLocation
  status: string
  phoneNumber?: string | null
  createdAt?: string | null
  tripId?: string | null
  scheduledTime?: string | null
}

export interface GetCarResponse {
  getCar: Car
  getTripsByCar?: TripOrigin[]
}

export interface LiveTripCar {
  plate: string
  capacity: number
  id: string
}

export interface LiveTripOrigin {
  latitude: number
  longitude: number
  placename: string
}

export interface LiveTripWaypoint {
  passed: boolean
  longitude: number
  latitude: number
  passedTimestamp?: string | null
  placename: string
  remainingDistance?: number | null
}

export interface LiveTripDriver {
  name: string
  id: string
  phone: string
  email: string
}

export interface LiveTripDestination {
  fare?: number | null
  latitude: number
  longitude: number
  placename: string
  remainingDistance?: number | null
}

export interface LiveTripCurrentLocation {
  address: string
  bearing: number
  latitude: number
  longitude: number
  speed: number
}

export interface LiveTrip {
  car: LiveTripCar
  remainingSeats: number
  origin: LiveTripOrigin
  departureTime: string
  status: string
  totalRevenue: number
  waypoints: LiveTripWaypoint[]
  driver: LiveTripDriver | null
  destination: LiveTripDestination
  currentLocation?: LiveTripCurrentLocation | null
  distance: number
}

export interface GetLiveTripsResponse {
  getLiveTrips: LiveTrip[]
}

export interface GetLiveTripsVariables {
  companyId: string
}

export interface TripHistoryDestination {
  fare?: number | null
  remainingDistance?: number | null
  placename: string
  passedTimestamp?: string | null
  passed: boolean
  longitude: number
  latitude: number
}

export interface TripHistoryDriver {
  name: string
  id: string
  phone: string
  email: string
}

export interface TripHistoryCar {
  capacity: number
  id: string
  plate: string
}

export interface TripHistoryOrigin {
  fare?: number | null
  remainingDistance?: number | null
  placename: string
  passedTimestamp?: string | null
  passed: boolean
  longitude: number
  latitude: number
}

export interface TripHistory {
  totalRevenue: number
  departureTime: string
  origin?: TripHistoryOrigin | null
  destination: TripHistoryDestination
  distance: number
  endTime?: string | null
  driver: TripHistoryDriver | null
  status: string
  remainingSeats: number
  car: TripHistoryCar
}

export interface GetTripHistoryResponse {
  getTripHistory: TripHistory[]
}

export interface GetTripHistoryVariables {
  companyId: string
  limit?: number | null
}

export interface CompanyDriverCurrentCar {
  plate: string
}

export interface CompanyDriver {
  email: string
  id: string
  lastTripTimestamp?: string | null
  licenseNumber: string
  name: string
  phone: string
  rating: number
  totalDistance: number
  totalRevenue: number
  totalTrips: number
  currentCar?: CompanyDriverCurrentCar | null
}

export interface GetCompanyDriversResponse {
  getCompanyDrivers: CompanyDriver[]
}

export interface GetCompanyDriversVariables {
  companyId: string
}

