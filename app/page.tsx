"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bus, UserCheck, TrendingUp, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { useCompanyDashboard } from "@/hooks/use-company-dashboard"

export default function Dashboard() {
  const { user } = useAuth()
  const userName = user?.username || user?.name || "User"
  const companyName = user?.companyName || null
  const { dashboard, loading, error } = useCompanyDashboard(user?.companyId)

  // Calculate percentages
  const activeBusesPercentage = dashboard
    ? Math.round((dashboard.activeBuses / dashboard.totalCars) * 100)
    : 0

  const statsCards = dashboard
    ? [
        {
          title: "Active Buses",
          value: dashboard.activeBuses.toString(),
          description: `Out of ${dashboard.totalCars} total buses`,
          icon: Bus,
          color: "text-green-600",
        },
        {
          title: "Ongoing Trips",
          value: dashboard.ongoingTrips.toString(),
          description: "Currently in progress",
          icon: Activity,
          color: "text-blue-600",
        },
        {
          title: "Today's Trips",
          value: dashboard.todayTrips.toString(),
          description: "Trips completed today",
          icon: TrendingUp,
          color: "text-purple-600",
        },
        {
          title: "Total Drivers",
          value: dashboard.totalDrivers.toString(),
          description: "Registered drivers",
          icon: UserCheck,
          color: "text-indigo-600",
        },
        {
          title: "Total Buses",
          value: dashboard.totalCars.toString(),
          description: "Fleet size",
          icon: Bus,
          color: "text-orange-600",
        },
      ]
    : []

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {userName}! Here&apos;s your fleet overview.</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            System Online
          </Badge>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading dashboard data. Please try again later.</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            : statsCards.map((card, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status</CardTitle>
              <CardDescription>Current operational status of your fleet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : dashboard ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Buses</span>
                    <span>
                      {dashboard.activeBuses}/{dashboard.totalCars} ({activeBusesPercentage}%)
                    </span>
                  </div>
                  <Progress value={activeBusesPercentage} className="h-2" />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Your company details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : dashboard ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                    <p className="text-sm font-semibold">{companyName || dashboard.company.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Code</p>
                    <p className="text-sm font-semibold">{dashboard.company.companyCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm font-semibold">{dashboard.company.address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Buses</p>
                    <p className="text-sm font-semibold">{dashboard.totalCars} vehicles</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
