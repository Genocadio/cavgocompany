"use client"

import { useCallback, useEffect, useState } from "react"
import { authenticatedFetch, getGraphqlEndpoint } from "@/lib/auth-client"

const COMPANY_PACKAGE_ACTIVITY_QUERY = `#graphql
  query CompanyPackageActivity(
    $companyId: ID!
    $startDate: String
    $endDate: String
    $statuses: [PackageStatus!]
    $tripId: ID
    $carId: ID
    $driverId: ID
  ) {
    companyPackageActivity(
      companyId: $companyId
      startDate: $startDate
      endDate: $endDate
      statuses: $statuses
      tripId: $tripId
      carId: $carId
      driverId: $driverId
    ) {
      companyId
      startTime
      endTime
      totalPackages
      inProgressPackages
      packages {
        id
        trackingCode
        deliveryType
        packageOrigin
        status
        companyId
        companyRefId
        tripId
        createdAt
        updatedAt
        carrierLegs {
          id
          driverId
          tripId
          companyId
          companyRefId
          vehicleId
          linkedAt
          fromStatus
          toStatus
        }
      }
      groups {
        tripId
        carId
        plate
        driverId
        driverName
        packageCount
      }
    }
  }
`

/** Statuses that still represent a package in progress (excludes delivered/completed/cancelled). */
export const ACTIVE_PACKAGE_STATUSES = [
  "CREATED",
  "ACCEPTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "PENDING_CONFIRMATION",
  "ORIGIN_OFFICE",
  "ASSIGNED_DRIVER",
  "DESTINATION_OFFICE",
  "READY_FOR_COLLECTION",
]

export const ALL_PACKAGE_STATUSES = [
  ...ACTIVE_PACKAGE_STATUSES,
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]

export interface PackageCarrierLeg {
  id: string
  driverId: string | null
  tripId: string | null
  companyId: string | null
  companyRefId: string | null
  vehicleId: string | null
  linkedAt: number
  fromStatus: string | null
  toStatus: string | null
}

export interface CompanyPackage {
  id: string
  trackingCode: string
  deliveryType: string
  packageOrigin: string
  status: string
  companyId: string | null
  companyRefId: string | null
  tripId: string | null
  createdAt: number
  updatedAt: number
  carrierLegs: PackageCarrierLeg[]
}

export interface PackageActivityGroup {
  tripId: string | null
  carId: string | null
  plate: string
  driverId: string | null
  driverName: string
  packageCount: number
}

export interface CompanyPackageActivity {
  companyId: string
  startTime: number
  endTime: number
  totalPackages: number
  inProgressPackages: number
  packages: CompanyPackage[]
  groups: PackageActivityGroup[]
}

type ApiPackageCarrierLeg = {
  id?: string | number | null
  driverId?: string | number | null
  tripId?: string | number | null
  companyId?: string | number | null
  companyRefId?: string | number | null
  vehicleId?: string | number | null
  linkedAt?: number | null
  fromStatus?: string | null
  toStatus?: string | null
}

type ApiCompanyPackage = {
  id?: string | number | null
  trackingCode?: string | null
  deliveryType?: string | null
  packageOrigin?: string | null
  status?: string | null
  companyId?: string | number | null
  companyRefId?: string | number | null
  tripId?: string | number | null
  createdAt?: number | null
  updatedAt?: number | null
  carrierLegs?: ApiPackageCarrierLeg[] | null
}

type ApiPackageActivityGroup = {
  tripId?: string | number | null
  carId?: string | number | null
  plate?: string | null
  driverId?: string | number | null
  driverName?: string | null
  packageCount?: number | null
}

interface UseCompanyPackagesOptions {
  companyId?: string | number | null
  startDate?: string
  endDate?: string
  statuses?: string[]
  tripId?: string | number | null
  carId?: string | number | null
  driverId?: string | number | null
}

interface UseCompanyPackagesResult {
  data: CompanyPackageActivity
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function asId(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === "") return null
  return String(value)
}

function asText(value?: string | number | null): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

function asNumber(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function emptyActivity(companyId = ""): CompanyPackageActivity {
  return {
    companyId,
    startTime: 0,
    endTime: 0,
    totalPackages: 0,
    inProgressPackages: 0,
    packages: [],
    groups: [],
  }
}

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeLeg(leg: ApiPackageCarrierLeg): PackageCarrierLeg {
  return {
    id: asId(leg.id) ?? "",
    driverId: asId(leg.driverId),
    tripId: asId(leg.tripId),
    companyId: asId(leg.companyId),
    companyRefId: asId(leg.companyRefId),
    vehicleId: asId(leg.vehicleId),
    linkedAt: asNumber(leg.linkedAt),
    fromStatus: leg.fromStatus ?? null,
    toStatus: leg.toStatus ?? null,
  }
}

function normalizePackage(item: ApiCompanyPackage): CompanyPackage {
  return {
    id: asId(item.id) ?? "",
    trackingCode: asText(item.trackingCode),
    deliveryType: asText(item.deliveryType),
    packageOrigin: asText(item.packageOrigin),
    status: asText(item.status),
    companyId: asId(item.companyId),
    companyRefId: asId(item.companyRefId),
    tripId: asId(item.tripId),
    createdAt: asNumber(item.createdAt),
    updatedAt: asNumber(item.updatedAt),
    carrierLegs: Array.isArray(item.carrierLegs) ? item.carrierLegs.map(normalizeLeg) : [],
  }
}

function normalizeGroup(group: ApiPackageActivityGroup): PackageActivityGroup {
  return {
    tripId: asId(group.tripId),
    carId: asId(group.carId),
    plate: asText(group.plate),
    driverId: asId(group.driverId),
    driverName: asText(group.driverName),
    packageCount: asNumber(group.packageCount),
  }
}

export function useCompanyPackages({
  companyId,
  startDate,
  endDate,
  statuses,
  tripId,
  carId,
  driverId,
}: UseCompanyPackagesOptions): UseCompanyPackagesResult {
  const [data, setData] = useState<CompanyPackageActivity>(() => emptyActivity())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default to today (local time) and the active status set so the page shows
  // packages sent today that are still in progress.
  const today = localDateString(new Date())
  const resolvedStartDate = startDate ?? today
  const resolvedEndDate = endDate ?? today
  const statusKey = (statuses ?? ACTIVE_PACKAGE_STATUSES).join(",")
  const resolvedTripId = asId(tripId as string | number | null | undefined)
  const resolvedCarId = asId(carId as string | number | null | undefined)
  const resolvedDriverId = asId(driverId as string | number | null | undefined)

  const fetchActivity = useCallback(async () => {
    if (companyId === null || companyId === undefined || companyId === "") {
      setData(emptyActivity())
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await authenticatedFetch(getGraphqlEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: COMPANY_PACKAGE_ACTIVITY_QUERY,
          variables: {
            companyId: String(companyId),
            startDate: resolvedStartDate,
            endDate: resolvedEndDate,
            statuses: statusKey ? statusKey.split(",") : undefined,
            tripId: resolvedTripId,
            carId: resolvedCarId,
            driverId: resolvedDriverId,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch packages: ${response.statusText}`)
      }

      const json = await response.json()
      if (json?.errors?.length) {
        throw new Error(json.errors[0]?.message || "GraphQL error")
      }

      const raw = json?.data?.companyPackageActivity
      if (!raw || typeof raw !== "object") {
        setData(emptyActivity(String(companyId)))
        return
      }

      setData({
        companyId: asText(raw.companyId) || String(companyId),
        startTime: asNumber(raw.startTime),
        endTime: asNumber(raw.endTime),
        totalPackages: asNumber(raw.totalPackages),
        inProgressPackages: asNumber(raw.inProgressPackages),
        packages: Array.isArray(raw.packages) ? raw.packages.map(normalizePackage) : [],
        groups: Array.isArray(raw.groups) ? raw.groups.map(normalizeGroup) : [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error fetching packages")
      setData(emptyActivity(String(companyId)))
    } finally {
      setLoading(false)
    }
  }, [companyId, resolvedStartDate, resolvedEndDate, statusKey, resolvedTripId, resolvedCarId, resolvedDriverId])

  useEffect(() => {
    void fetchActivity()
  }, [fetchActivity])

  return { data, loading, error, refetch: fetchActivity }
}
