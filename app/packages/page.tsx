"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Package } from "lucide-react"
import AppHeader from "@/components/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/auth-context"
import {
  ACTIVE_PACKAGE_STATUSES,
  useCompanyPackages,
  type CompanyPackage,
  type PackageCarrierLeg,
} from "@/hooks/use-company-packages"

const activeStatuses = new Set<string>(ACTIVE_PACKAGE_STATUSES)

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

function PackageRow({ item, plateByTrip }: { item: CompanyPackage; plateByTrip: Map<string, string> }) {
  const leg = latestCarrierLeg(item.carrierLegs)
  const plate = leg?.tripId ? plateByTrip.get(leg.tripId) : undefined

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
              Trip {leg.tripId || "—"} · {plate || "—"}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function CompanyPackagesPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const companyId = user?.companyId
  const { data, loading, error, refetch } = useCompanyPackages({ companyId })

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

  return (
    <main className="min-h-screen bg-background">
      <AppHeader showViewSwitcher={false} />
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Back to fleet" onClick={() => router.push("/")}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Package className="h-5 w-5" />
              Packages
            </h1>
            <p className="text-sm text-muted-foreground">Packages sent today that are in progress</p>
          </div>
        </div>

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
          <SummaryCard title="Total packages" value={data.totalPackages} loading={loading} />
          <SummaryCard title="In-progress packages" value={data.inProgressPackages} loading={loading} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">By trip / car / driver</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Car (plate)</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Packages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton columns={4} />
                ) : data.groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No package groups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.groups.map((group, index) => {
                    const carHref = group.tripId && group.carId ? `/car/${encodeURIComponent(group.carId)}` : null
                    return (
                      <TableRow key={`${group.tripId || "no-trip"}-${group.carId || "no-car"}-${index}`}>
                        <TableCell className="font-medium">
                          {carHref ? (
                            <Link href={carHref} className="text-primary underline-offset-4 hover:underline">
                              {group.tripId || "—"}
                            </Link>
                          ) : (
                            group.tripId || "—"
                          )}
                        </TableCell>
                        <TableCell>{group.plate || "—"}</TableCell>
                        <TableCell>
                          {group.driverName || (group.driverId ? `Driver ${group.driverId}` : "—")}
                        </TableCell>
                        <TableCell>{group.packageCount}</TableCell>
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
            <CardTitle className="text-lg">Packages</CardTitle>
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
                ) : data.packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.packages.map((item) => (
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
