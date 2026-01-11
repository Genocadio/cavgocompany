export interface Trip {
  id: string
  start: [number, number]
  end: [number, number]
  originName?: string
  destinationName: string
  nextStopName?: string
  destinations?: Array<{
    id: string
    addres?: string
    remainingDistance?: number
    isPassed?: boolean
    index?: number
  }>
  history: [number, number][]
  distanceKm: number
  // Optional total distance of the trip (km)
  totalDistanceKm?: number
  totalSeats: number
  bookedSeats: number
  totalRevenue: number
  currency?: string
  // Optional metadata coming from API mapping
  status?: string
  createdAt?: string
}

export interface Car {
  id: string
  plateNumber: string
  status: "with-trips" | "no-trips"
  speed: number
  bearing: number
  position: [number, number]
  gpsTimestamp?: string
  currentTrip?: Trip
  tripHistory: Trip[]
}

export const DUMMY_CARS: Car[] = [
  {
    id: "1",
    plateNumber: "ABC-1234",
    status: "active",
    speed: 65,
    bearing: 45,
    position: [51.505, -0.09],
    currentTrip: {
      id: "t1",
      start: [51.5, -0.1],
      end: [51.52, -0.05],
      destinationName: "Central Station",
      history: [
        [51.5, -0.1],
        [51.502, -0.095],
        [51.505, -0.09],
        [51.508, -0.085],
        [51.511, -0.08],
        [51.514, -0.075],
        [51.517, -0.07],
        [51.519, -0.06],
      ],
      distanceKm: 4.2,
      totalSeats: 48,
      bookedSeats: 42,
      totalRevenue: 2100,
      currency: "USD",
    },
    tripHistory: [],
  },
  {
    id: "2",
    plateNumber: "XYZ-9876",
    status: "idle",
    speed: 0,
    bearing: 180,
    position: [51.51, -0.12],
    tripHistory: [
      {
        id: "th1",
        start: [51.48, -0.15],
        end: [51.51, -0.12],
        destinationName: "Business Park",
        history: [],
        distanceKm: 8.5,
        totalSeats: 52,
        bookedSeats: 45,
        totalRevenue: 3150,
        currency: "USD",
      },
    ],
  },
  {
    id: "3",
    plateNumber: "KGB-007",
    status: "active",
    speed: 110,
    bearing: 270,
    position: [51.49, -0.15],
    currentTrip: {
      id: "t2",
      start: [51.45, -0.2],
      end: [51.55, -0.25],
      destinationName: "Airport Terminal 2",
      history: [
        [51.45, -0.2],
        [51.46, -0.19],
        [51.47, -0.18],
        [51.48, -0.17],
        [51.49, -0.15],
        [51.50, -0.16],
        [51.51, -0.18],
        [51.52, -0.20],
        [51.53, -0.22],
      ],
      distanceKm: 12.8,
      totalSeats: 56,
      bookedSeats: 51,
      totalRevenue: 5355,
      currency: "USD",
    },
    tripHistory: [],
  },
  {
    id: "4",
    plateNumber: "DEF-5555",
    status: "active",
    speed: 75,
    bearing: 90,
    position: [51.515, -0.095],
    currentTrip: {
      id: "t3",
      start: [51.515, -0.12],
      end: [51.515, -0.07],
      destinationName: "West End",
      history: [
        [51.515, -0.12],
        [51.515, -0.11],
        [51.515, -0.10],
        [51.515, -0.095],
      ],
      distanceKm: 3.5,
      totalSeats: 48,
      bookedSeats: 35,
      totalRevenue: 1400,
      currency: "USD",
    },
    tripHistory: [],
  },
  {
    id: "5",
    plateNumber: "QWE-3333",
    status: "active",
    speed: 55,
    bearing: 135,
    position: [51.498, -0.088],
    currentTrip: {
      id: "t4",
      start: [51.495, -0.095],
      end: [51.505, -0.075],
      destinationName: "City Mall",
      history: [
        [51.495, -0.095],
        [51.497, -0.092],
        [51.498, -0.088],
        [51.500, -0.085],
        [51.502, -0.082],
        [51.503, -0.080],
      ],
      distanceKm: 2.8,
      totalSeats: 48,
      bookedSeats: 48,
      totalRevenue: 1920,
      currency: "USD",
    },
    tripHistory: [],
  },
  {
    id: "6",
    plateNumber: "RTY-8888",
    status: "idle",
    speed: 0,
    bearing: 0,
    position: [51.508, -0.13],
    tripHistory: [
      {
        id: "th2",
        start: [51.50, -0.14],
        end: [51.508, -0.13],
        destinationName: "North District",
        history: [],
        distanceKm: 1.2,
        totalSeats: 48,
        bookedSeats: 12,
        totalRevenue: 420,
        currency: "USD",
      },
    ],
  },
]
