"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Filter, Package, RefreshCcw, X } from "lucide-react"
import AppHeader from "@/components/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/auth-context"
import {
  ACTIVE_PACKAGE_STATUSES,
  ALL_PACKAGE_STATUSES,
  useCompanyPackages,
  type CompanyPackage,
  type PackageActivityGroup,
  type PackageCarrierLeg,
} from "@/hooks/use-company-packages"

const activeStatuses = new Set<string>(ACTIVE_PACKAGE_STATUSES)

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function humanize(value: string): string {
  if (!value) return "—"
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  const normalized = status.toUpperCase()
  if (normalized === "CANCELLED") return "destructive"
  return activeStatuses.has(normalized) ? "default" : "secondary"
}

function formatCreatedAt(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—"
  return new Date(ms).toLocaleString()
}

function latestCarrierLeg(legs: PackageCarrierLeg[]): PackageCarrierLeg | null {
  return legs.reduce<PackageCarrierLeg | null>(
    (latest, leg) => (!latest || leg.linkedAt >= latest.linkedAt ? leg : latest),
    null,
  )
}

function TableRowsSkeleton({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function SummaryCard({ title, value, loading }: { title: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  )
}

type GroupFilter = {
  key: string
  label: string
  tripId?: string | null
  carId?: string | null
  driverId?: string | null
}

function groupKey(group: PackageActivityGroup, index: number): string {
  return `${group.tripId || "trip"}:${group.carId || "car"}:${group.driverId || "drv"}:${index}`
}

function groupLabel(group: PackageActivityGroup): string {
  const parts = [
    group.tripId ? `Trip ${group.tripId}` : null,
    group.carId ? `Car ${group.plate || group.carId}` : group.plate ? `Car ${group.plate}` : null,
    group.driverName || (group.driverId ? `Driver ${group.driverId}` : null),
  ].filter(Boolean)
  return parts.length ? parts.join(" · ") : "Unassigned"
}

function packageMatchesGroup(pkg: CompanyPackage, filter: GroupFilter): boolean {
  const hasTrip = filter.tripId ? (pkg.tripId === filter.tripId || pkg.carrierLegs.some((l) => l.tripId === filter.tripId)) : true
  const hasCar = filter.carId ? pkg.carrierLegs.some((l) => l.vehicleId === filter.carId) : true
  const hasDriver = filter.driverId ? pkg.carrierLegs.some((l) => l.driverId === filter.driverId) : true
  return hasTrip && hasCar && hasDriver
}

function PackageRow({ item, plateByTrip }: { item: CompanyPackage; plateByTrip: Map<string, string> }) {
  const leg = latestCarrierLeg(item.carrierLegs)
  const plate = leg?.tripId ? plateByTrip.get(leg.tripId) : leg?.vehicleId || undefined

  return (
    <TableRow key={item.id || item.trackingCode}>
      <TableCell className="font-medium">{item.trackingCode || "—"}</TableCell>
      <TableCell>
        <Badge variant={statusVariant(item.status)}>{humanize(item.status)}</Badge>
      </TableCell>
      <TableCell>{humanize(item.packageOrigin)}</TableCell>
      <TableCell>{humanize(item.deliveryType)}</TableCell>
      <TableCell>{formatCreatedAt(item.createdAt)}</TableCell>
      <TableCell>
        {leg ? (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{leg.driverId ? `Driver ${leg.driverId}` : "—"}</span>
            <span className="text-muted-foreground">
              Trip {leg.tripId || item.tripId || "—"} · {plate || "—"}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{item.tripId ? `Trip ${item.tripId}` : "—"}</span>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function CompanyPackagesPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const companyId = user?.companyId
  const initialEnd = new Date()
  const initialStart = new Date()
  initialStart.setDate(initialEnd.getDate() - 6)
  const [startDate, setStartDate] = useState(localDateString(initialStart))
  const [endDate, setEndDate] = useState(localDateString(initialEnd))
  const [statusMode, setStatusMode] = useState<"active" | "all">("all")
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter | null>(null)

  const statuses = useMemo(() => (statusMode === "active" ? [...ACTIVE_PACKAGE_STATUSES] : [...ALL_PACKAGE_STATUSES]), [statusMode])
  const { data, loading, error, refetch } = useCompanyPackages({ companyId, startDate, endDate, statuses })

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user.companyId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Company access required</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but it does not have an active Cavgo company membership.
            Ask your company administrator to add or approve your account.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  const plateByTrip = new Map<string, string>()
  for (const group of data.groups) {
    if (group.tripId && group.plate) plateByTrip.set(group.tripId, group.plate)
  }

  const filteredPackages = selectedGroup ? data.packages.filter((pkg) => packageMatchesGroup(pkg, selectedGroup)) : data.packages

  const setToday = () => {
    const now = localDateString(new Date())
    setStartDate(now)
    setEndDate(now)
  }

  const setLast7Days = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    setStartDate(localDateString(start))
    setEndDate(localDateString(end))
  }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader showViewSwitcher={false} />
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Back to fleet" onClick={() => router.push("/")}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Package className="h-5 w-5" />
              Package reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Company package activity by date, trip, car, and driver (including booking-independent deliveries).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[170px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[170px]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={setToday}>Today</Button>
                <Button type="button" variant="outline" size="sm" onClick={setLast7Days}>Last 7 days</Button>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <Button type="button" variant={statusMode === "active" ? "default" : "outline"} size="sm" onClick={() => setStatusMode("active")}>
                  In progress
                </Button>
                <Button type="button" variant={statusMode === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusMode("all")}>
                  All statuses
                </Button>
              </div>
            </div>
            {selectedGroup && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Filtered to:</span>
                <span className="font-medium">{selectedGroup.label}</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedGroup(null)}>
                  <X className="mr-1 h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load packages</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard title="Total packages (in scope)" value={data.totalPackages} loading={loading} />
          <SummaryCard title="In-progress packages" value={data.inProgressPackages} loading={loading} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">By trip / car / driver</CardTitle>
            <p className="text-sm text-muted-foreground">Click a group to filter the packages list. Groups are based on the latest carrier leg.</p>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Car (plate)</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton columns={5} />
                ) : data.groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No package groups found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.groups.map((group, index) => {
                    const key = groupKey(group, index)
                    const isSelected = selectedGroup?.key === key
                    const carHref = group.carId ? `/car/${encodeURIComponent(group.carId)}` : null
                    const filter: GroupFilter = {
                      key,
                      label: groupLabel(group),
                      tripId: group.tripId,
                      carId: group.carId,
                      driverId: group.driverId,
                    }
                    return (
                      <TableRow
                        key={key}
                        className={isSelected ? "bg-primary/5" : "cursor-pointer hover:bg-muted/40"}
                        onClick={() => setSelectedGroup(isSelected ? null : filter)}
                      >
                        <TableCell className="font-medium">{group.tripId || "—"}</TableCell>
                        <TableCell>{group.plate || group.carId || "—"}</TableCell>
                        <TableCell>{group.driverName || (group.driverId ? `Driver ${group.driverId}` : "—")}</TableCell>
                        <TableCell>{group.packageCount}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {carHref ? (
                            <Link href={carHref} className="text-sm text-primary underline-offset-4 hover:underline">
                              View car
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Packages {selectedGroup ? `(${filteredPackages.length} filtered)` : `(${data.packages.length})`}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Delivery type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Latest carrier leg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton columns={6} />
                ) : filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No packages found for this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((item) => (
                    <PackageRow key={item.id || item.trackingCode} item={item} plateByTrip={plateByTrip} />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
