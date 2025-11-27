export interface CompanyDashboardCompany {
  address: string
  companyCode: string
  name: string
}

export interface CompanyDashboard {
  activeBuses: number
  company: CompanyDashboardCompany
  ongoingTrips: number
  todayTrips: number
  totalCars: number
  totalDrivers: number
}

export interface GetCompanyDashboardResponse {
  companyDashboard: CompanyDashboard
}

export interface GetCompanyDashboardVariables {
  companyId: string
}

export interface LocationCoordinates {
  lng: number
  lat: number
}

export interface CurrentLocation {
  bearing: number
  location: LocationCoordinates
  speed: number
  timestamp: string
}

export interface CurrentDriver {
  name: string
  id: string
  email: string
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

export interface LatestTrip {
  id: string
  status: string
  totalDistance: number
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
  capacity: number
  isOnline: boolean
  model: string
  plate: string
  status: string
  latestTrip: LatestTrip | null
  id: string
  currentLocation: CurrentLocation | null
  currentDriver: CurrentDriver | null
  // Legacy fields for backward compatibility (may not be present in new query)
  driver?: Driver | null
  operationalStatus?: string
  make?: string
  latestTripCompletionTime?: string | null
  activeTrip?: ActiveTrip | null
  lastUpdated?: string | null
  connectionStatus?: string | null
}

export interface GetCarsByCompanyResponse {
  carsByCompany: Car[]
}

export interface GetCarsByCompanyVariables {
  companyId: string
}

export interface CarOrigin {
  id: string
  addres: string
  lat: number
  lng: number
}

export interface CarDestination {
  id: string
  addres: string
  lat: number
  lng: number
  index: number
  fare: number
  remainingDistance: number
  isPassede: boolean
  passedTime?: string | null
}

export interface CarLatestTrip {
  id: string
  origin: CarOrigin
  destinations: CarDestination[]
  status: string
  totalDistance: number
  createdAt: string
  updatedAt: string
}

export interface CarDetail {
  id: string
  plate: string
  model: string
  capacity: number
  status: string
  isOnline: boolean
  currentLocation: CurrentLocation | null
  currentDriver: CurrentDriverDetail | null
  latestTrip: CarLatestTrip | null
  companyId: string
}

export interface CurrentDriverDetail {
  id: string
  name: string
  phoneNumber: string
  email: string
  companyId: string
}

export interface GetCarVariables {
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
  car: CarDetail
}

export interface TripByCompanyCarLocation {
  bearing: number
  location: LocationCoordinates
  speed: number
  timestamp: string
}

export interface TripByCompanyCar {
  capacity: number
  currentLocation: TripByCompanyCarLocation | null
  model: string
  plate: string
  id: string
}

export interface TripByCompanyDriver {
  id: string
  email: string
  name: string
  phoneNumber: string
}

export interface TripByCompanyCarDriver {
  car: TripByCompanyCar
  driver: TripByCompanyDriver | null
}

export interface TripByCompanyOrigin {
  addres: string
  id: string
  lat: number
  lng: number
}

export interface TripByCompanyDestination {
  addres: string
  fare: number
  id: string
  index: number
  isPassede: boolean
  lat: number
  lng: number
  passedTime?: string | null
  remainingDistance: number
}

export interface TripByCompany {
  id: string
  carDriver: TripByCompanyCarDriver
  origin: TripByCompanyOrigin
  destinations: TripByCompanyDestination[]
  status: string
  totalDistance: number
  createdAt: string
  updatedAt: string
}

export interface GetTripsByCompanyResponse {
  tripsByCompany: TripByCompany[]
}

export interface GetTripsByCompanyVariables {
  companyId: string
}

export interface ActiveTripCar {
  capacity: number
  plate: string
  model: string
}

export interface ActiveTripDriver {
  phoneNumber: string
  name: string
  id: string
}

export interface ActiveTripCarDriver {
  car: ActiveTripCar
  driver: ActiveTripDriver | null
}

export interface ActiveCompanyTrip {
  id: string
  origin: TripByCompanyOrigin
  totalDistance: number
  status: string
  updatedAt: string
  createdAt: string
  carDriver: ActiveTripCarDriver
  destinations: TripByCompanyDestination[]
}

export interface GetActiveTripsResponse {
  getActiveCompanyTrips: ActiveCompanyTrip[]
}

export interface GetActiveTripsVariables {
  companyId: string
}

// Legacy types for backward compatibility
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


export interface DriverCurrentCar {
  capacity: number
  model: string
  plate: string
}

export interface DriverTripOrigin {
  addres: string
}

export interface DriverTripDestination {
  addres: string
  fare: number
  remainingDistance: number
  passedTime?: string | null
}

export interface DriverLatestTrip {
  origin: DriverTripOrigin
  status: string
  destinations: DriverTripDestination[]
}

export interface CompanyDriver {
  id: string
  name: string
  phoneNumber: string
  email: string
  status: string
  currentCar?: DriverCurrentCar | null
  latestTrip?: DriverLatestTrip | null
  companyId: string
}

export interface GetCompanyDriversResponse {
  getDriversByCompany: CompanyDriver[]
}

export interface GetCompanyDriversVariables {
  companyId: string
}

export interface TripsByStatus {
  completed: number
  cancelled: number
  in_progress: number
  scheduled: number
}

export interface SeriesDataPoint {
  value: number
  label: string
}

export interface RevenueSeries {
  unit: string
  granularity: string
  data: SeriesDataPoint[]
}

export interface TripsSeries {
  data: SeriesDataPoint[]
  granularity: string
  unit: string
}

export interface CompanyMetrics {
  companyId: string
  period: string
  startTime: number
  endTime: number
  totalTrips: number
  completedTrips: number
  cancelledTrips: number
  inProgressTrips: number
  scheduledTrips: number
  totalRevenue: number
  revenueFromCompletedTrips: number
  totalDistance: number
  totalDuration: number
  averageTripDistance: number
  averageTripDuration: number
  uniqueDrivers: number
  uniqueCars: number
  tripsByStatus: TripsByStatus
  revenueSeries: RevenueSeries
  tripsSeries: TripsSeries
}

export interface GetCompanyMetricsResponse {
  companyMetrics: CompanyMetrics
}

export interface GetCompanyMetricsVariables {
  companyId: string
  startTime?: number | null
  endTime?: number | null
}

