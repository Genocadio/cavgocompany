import { gql } from "@apollo/client"

export const GET_COMPANY_DASHBOARD = gql`
  query GetCompanyDashboard($companyId: ID!) {
    getCompanyDashboard(companyId: $companyId) {
      activeCars
      averageRating
      companyCode
      companyId
      companyName
      offlineCars
      pendingBookings
      totalBookings
      totalCars
      totalDrivers
      totalRevenueToday
    }
  }
`

export const GET_CARS_BY_COMPANY = gql`
  query GetCarsByCompany($companyId: ID!) {
    getCarsByCompany(companyId: $companyId) {
      currentLocation {
        address
        bearing
        latitude
        longitude
        speed
        timestamp
      }
      driver {
        id
        name
        phone
      }
      id
      operationalStatus
      plate
      capacity
      make
      model
      isOnline
      latestTripCompletionTime
      activeTrip {
        remainingSeats
        startTime
        status
        waypoints {
          fare
          placename
          passedTimestamp
          remainingDistance
          passed
          longitude
          latitude
        }
        origin {
          placename
          passedTimestamp
          passed
          longitude
          latitude
        }
        id
        endTime
        distance
        destination {
          fare
          latitude
          longitude
          passed
          passedTimestamp
          placename
          remainingDistance
        }
        departureTime
      }
    }
  }
`

export const GET_CAR = gql`
  query GetCar($getCarId: ID!, $carId: ID!) {
    getCar(id: $getCarId) {
      activeTrip {
        id
        remainingSeats
        startTime
        status
        waypoints {
          fare
          placename
          passedTimestamp
          remainingDistance
          passed
          longitude
          latitude
        }
        origin {
          placename
          passedTimestamp
          passed
          longitude
          latitude
        }
        endTime
        distance
        destination {
          fare
          latitude
          longitude
          passed
          passedTimestamp
          placename
          remainingDistance
        }
        departureTime
      }
      driver {
        email
        licenseNumber
        name
        phone
      }
      capacity
      isOnline
      make
      model
      plate
      operationalStatus
      lastUpdated
      id
      currentLocation {
        address
        bearing
        latitude
        longitude
        speed
        timestamp
      }
      connectionStatus
    }
    getTripsByCar(carId: $carId) {
      origin {
        placename
        passedTimestamp
        passed
        longitude
        latitude
      }
    }
  }
`

export const GET_BOOKINGS_BY_TRIP = gql`
  query GetBookingsByTrip($tripId: ID!) {
    getBookingsByTrip(tripId: $tripId) {
      numberOfTickets
      customerName
      fare
      email
      id
      phoneNumber
      pickupLocation {
        address
      }
      dropoffLocation {
        address
      }
      status
      createdAt
      tripId
      scheduledTime
      paymentMethod
    }
  }
`

export const GET_LIVE_TRIPS = gql`
  query GetLiveTrips($companyId: ID!) {
    getLiveTrips(companyId: $companyId) {
      car {
        plate
        capacity
        id
      }
      remainingSeats
      origin {
        latitude
        longitude
        placename
      }
      departureTime
      status
      totalRevenue
      waypoints {
        passed
        longitude
        latitude
        passedTimestamp
        placename
        remainingDistance
      }
      driver {
        name
        id
        phone
        email
      }
      destination {
        fare
        latitude
        longitude
        placename
        remainingDistance
      }
      currentLocation {
        address
        bearing
        latitude
        longitude
        speed
      }
      distance
    }
  }
`

export const GET_TRIP_HISTORY = gql`
  query GetTripHistory($companyId: ID!, $limit: Int) {
    getTripHistory(companyId: $companyId, limit: $limit) {
      totalRevenue
      departureTime
      origin {
        fare
        remainingDistance
        placename
        passedTimestamp
        passed
        longitude
        latitude
      }
      destination {
        fare
        remainingDistance
        placename
        passedTimestamp
        passed
        longitude
        latitude
      }
      distance
      endTime
      driver {
        name
        id
        phone
        email
      }
      status
      remainingSeats
      car {
        capacity
        id
        plate
      }
    }
  }
`

export const GET_COMPANY_DRIVERS = gql`
  query GetCompanyDrivers($companyId: ID!) {
    getCompanyDrivers(companyId: $companyId) {
      email
      id
      lastTripTimestamp
      licenseNumber
      name
      phone
      rating
      totalDistance
      totalRevenue
      totalTrips
      currentCar {
        plate
      }
    }
  }
`

