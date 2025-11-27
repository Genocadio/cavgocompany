import { gql } from "@apollo/client"

export const GET_COMPANY_DASHBOARD = gql`
  query CompanyDashboard($companyId: ID!) {
    companyDashboard(companyId: $companyId) {
      activeBuses
      company {
        address
        companyCode
        name
      }
      ongoingTrips
      todayTrips
      totalCars
      totalDrivers
    }
  }
`

export const GET_CARS_BY_COMPANY = gql`
  query CarsByCompany($companyId: ID!) {
    carsByCompany(companyId: $companyId) {
      capacity
      isOnline
      model
      plate
      status
      latestTrip {
        id
        status
        totalDistance
      }
      id
      currentLocation {
        bearing
        location {
          lng
          lat
        }
        speed
        timestamp
      }
      currentDriver {
        name
        id
        email
      }
    }
  }
`

export const GET_CAR = gql`
  query Car($carId: ID!) {
    car(id: $carId) {
      id
      plate
      model
      capacity
      status
      isOnline
      currentLocation {
        location {
          lat
          lng
        }
        speed
        bearing
        timestamp
      }
      currentDriver {
        id
        name
        phoneNumber
        email
        companyId
      }
      latestTrip {
        id
        origin {
          id
          addres
          lat
          lng
        }
        destinations {
          id
          addres
          lat
          lng
          index
          fare
          remainingDistance
          isPassede
          passedTime
        }
        status
        totalDistance
        createdAt
        updatedAt
      }
      companyId
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

export const GET_TRIPS_BY_COMPANY = gql`
  query TripsByCompany($companyId: ID!) {
    tripsByCompany(companyId: $companyId) {
      id
      carDriver {
        car {
          capacity
          currentLocation {
            bearing
            location {
              lat
              lng
            }
            speed
            timestamp
          }
          model
          plate
          id
        }
        driver {
          id
          email
          name
          phoneNumber
        }
      }
      origin {
        addres
        id
        lat
        lng
      }
      destinations {
        addres
        fare
        id
        index
        isPassede
        lat
        lng
        passedTime
        remainingDistance
      }
      status
      totalDistance
      createdAt
      updatedAt
    }
  }
`

export const GET_ACTIVE_TRIPS = gql`
  query GetActiveCompanyTrips($companyId: ID!) {
    getActiveCompanyTrips(companyId: $companyId) {
      id
      origin {
        id
        addres
        lat
        lng
      }
      totalDistance
      status
      updatedAt
      createdAt
      carDriver {
        car {
          capacity
          plate
          model
        }
        driver {
          phoneNumber
          name
          id
        }
      }
      destinations {
        addres
        fare
        id
        index
        isPassede
        lat
        lng
        passedTime
        remainingDistance
      }
    }
  }
`

export const GET_COMPANY_DRIVERS = gql`
  query GetDriversByCompany($companyId: ID!) {
    getDriversByCompany(companyId: $companyId) {
      id
      name
      phoneNumber
      email
      status
      currentCar {
        capacity
        model
        plate
      }
      latestTrip {
        origin {
          addres
        }
        status
        destinations {
          addres
          fare
          remainingDistance
          passedTime
        }
      }
      companyId
    }
  }
`

export const GET_COMPANY_METRICS = gql`
  query CompanyMetrics($companyId: ID!, $startTime: Int, $endTime: Int) {
    companyMetrics(companyId: $companyId, startTime: $startTime, endTime: $endTime) {
      companyId
      period
      startTime
      endTime
      totalTrips
      completedTrips
      cancelledTrips
      inProgressTrips
      scheduledTrips
      totalRevenue
      revenueFromCompletedTrips
      totalDistance
      totalDuration
      averageTripDistance
      averageTripDuration
      uniqueDrivers
      uniqueCars
      tripsByStatus {
        completed
        cancelled
        in_progress
        scheduled
      }
      revenueSeries {
        unit
        granularity
        data {
          value
          label
        }
      }
      tripsSeries {
        data {
          label
          value
        }
        granularity
        unit
      }
    }
  }
`

