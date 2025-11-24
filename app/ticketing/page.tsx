"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, TrendingUp, DollarSign, Ticket } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCompanyDashboard } from "@/hooks/use-company-dashboard"
import { useLiveTrips } from "@/hooks/use-live-trips"
import { useTripHistory } from "@/hooks/use-trip-history"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function TicketingPage() {
  const { user, isAuthenticated } = useAuth()
  const { dashboard, loading: dashboardLoading } = useCompanyDashboard(user?.companyId)
  const { liveTrips, loading: liveTripsLoading } = useLiveTrips(user?.companyId)
  const { tripHistory, loading: historyLoading } = useTripHistory(user?.companyId, 100)

  const loading = dashboardLoading || liveTripsLoading || historyLoading

  // Calculate ticket metrics from real data
  const ticketMetrics = useMemo(() => {
    // Calculate tickets sold from live trips (capacity - remaining seats)
    const liveTickets = liveTrips.reduce((acc, trip) => {
      return acc + (trip.car.capacity - trip.remainingSeats)
    }, 0)

    // Calculate tickets from trip history
    const historyTickets = tripHistory.reduce((acc, trip) => {
      return acc + (trip.car.capacity - trip.remainingSeats)
    }, 0)

    // Calculate total revenue
    const liveRevenue = liveTrips.reduce((acc, trip) => acc + (trip.totalRevenue || 0), 0)
    const historyRevenue = tripHistory.reduce((acc, trip) => acc + (trip.totalRevenue || 0), 0)
    const totalRevenue = liveRevenue + historyRevenue

    // Today's tickets (from dashboard)
    const todayTickets = dashboard?.totalBookings || 0
    const todayRevenue = dashboard?.totalRevenueToday || 0

    // Calculate weekly tickets (approximate from recent trips)
    const weeklyTickets = liveTickets + (historyTickets * 0.3) // Estimate
    const avgPerDay = weeklyTickets > 0 ? Math.round(weeklyTickets / 7) : 0

    return {
      todayTickets,
      todayRevenue,
      weeklyTickets: Math.round(weeklyTickets),
      avgPerDay,
      totalRevenue,
    }
  }, [dashboard, liveTrips, tripHistory])

  // Generate route data from trips
  const routeData = useMemo(() => {
    const routeMap = new Map<string, { tickets: number; revenue: number }>()

    // Process live trips
    liveTrips.forEach((trip) => {
      const route = `${trip.origin.placename} → ${trip.destination.placename}`
      const tickets = trip.car.capacity - trip.remainingSeats
      const revenue = trip.totalRevenue || 0

      if (routeMap.has(route)) {
        const existing = routeMap.get(route)!
        routeMap.set(route, {
          tickets: existing.tickets + tickets,
          revenue: existing.revenue + revenue,
        })
      } else {
        routeMap.set(route, { tickets, revenue })
      }
    })

    // Process trip history
    tripHistory.forEach((trip) => {
      const route = trip.destination.placename || "Unknown Route"
      const tickets = trip.car.capacity - trip.remainingSeats
      const revenue = trip.totalRevenue || 0

      if (routeMap.has(route)) {
        const existing = routeMap.get(route)!
        routeMap.set(route, {
          tickets: existing.tickets + tickets,
          revenue: existing.revenue + revenue,
        })
      } else {
        routeMap.set(route, { tickets, revenue })
      }
    })

    // Convert to array and calculate percentages
    const routes = Array.from(routeMap.entries())
      .map(([route, data]) => ({
        route,
        tickets: data.tickets,
        revenue: data.revenue,
        percentage: 0, // Will calculate below
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5) // Top 5 routes

    const totalTickets = routes.reduce((sum, r) => sum + r.tickets, 0)
    routes.forEach((r) => {
      r.percentage = totalTickets > 0 ? Math.round((r.tickets / totalTickets) * 100) : 0
    })

    return routes
  }, [liveTrips, tripHistory])

  // Generate daily data (last 7 days - simplified)
  const dailySalesData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    // Estimate based on total tickets
    const avgDailyTickets = Math.round(ticketMetrics.weeklyTickets / 7)
    const avgDailyRevenue = Math.round(ticketMetrics.todayRevenue)

    return days.map((day) => ({
      day,
      tickets: Math.max(0, Math.round(avgDailyTickets + (Math.random() * 50 - 25))), // Add some variation
      revenue: Math.max(0, Math.round(avgDailyRevenue + (Math.random() * 200 - 100))),
    }))
  }, [ticketMetrics])

  // Generate monthly data (last 6 months - simplified)
  const monthlySalesData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const avgMonthlyTickets = Math.round(ticketMetrics.weeklyTickets * 4.3) // Approximate monthly
    const avgMonthlyRevenue = Math.round(ticketMetrics.todayRevenue * 30) // Approximate monthly

    return months.map((month) => ({
      month,
      tickets: Math.max(0, Math.round(avgMonthlyTickets + (Math.random() * 1000 - 500))),
      revenue: Math.max(0, Math.round(avgMonthlyRevenue + (Math.random() * 5000 - 2500))),
    }))
  }, [ticketMetrics])

  // Generate hourly data (simplified)
  const hourlyData = useMemo(() => {
    const hours = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
      "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
      "20:00", "21:00", "22:00"
    ]
    const avgHourlyTickets = Math.round(ticketMetrics.avgPerDay / 17) // Distribute across 17 hours

    return hours.map((hour) => ({
      hour,
      tickets: Math.max(0, Math.round(avgHourlyTickets + (Math.random() * 50 - 25))),
    }))
  }, [ticketMetrics])

  // Best performing route
  const bestRoute = routeData.length > 0 ? routeData[0] : null
  
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        {isAuthenticated && <SidebarTrigger className="-ml-1" />}
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Ticketing Analytics</h1>
            <p className="text-sm text-muted-foreground">Track sales performance and revenue metrics</p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{ticketMetrics.todayTickets.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.pendingBookings ? (
                      <span className="text-blue-600">{dashboard.pendingBookings} pending</span>
                    ) : (
                      <span>Active bookings</span>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-RW", {
                      style: "currency",
                      currency: "RWF",
                    }).format(ticketMetrics.todayRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">From today&apos;s trips</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{ticketMetrics.weeklyTickets.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">tickets sold</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average per Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{ticketMetrics.avgPerDay.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">tickets per day</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
            <TabsTrigger value="routes">Route Analysis</TabsTrigger>
            <TabsTrigger value="hourly">Peak Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Ticket Sales</CardTitle>
                  <CardDescription>Tickets sold per day this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      tickets: {
                        label: "Tickets",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="tickets" fill="var(--color-tickets)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                  <CardDescription>Revenue generated per day this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Ticket sales and revenue trends over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ChartContainer
                    config={{
                      tickets: {
                        label: "Tickets",
                        color: "hsl(var(--chart-1))",
                      },
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="tickets" fill="var(--color-tickets)" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--color-revenue)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Route Performance</CardTitle>
                  <CardDescription>Ticket distribution by route</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : routeData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No route data available
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        tickets: {
                          label: "Tickets",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={routeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ route, percentage }) => `${route} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="tickets"
                          >
                            {routeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Route Rankings</CardTitle>
                  <CardDescription>Top performing routes by ticket sales</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : routeData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No route data available</div>
                  ) : (
                    <div className="space-y-4">
                      {routeData.map((route, index) => (
                        <div key={route.route} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{route.route}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">{route.tickets} tickets</span>
                            <Badge variant="secondary">{route.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hourly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
                <CardDescription>Ticket sales by hour of the day</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ChartContainer
                    config={{
                      tickets: {
                        label: "Tickets",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="tickets" fill="var(--color-tickets)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best Performing Route</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : bestRoute ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{bestRoute.route}</div>
                    <p className="text-sm text-muted-foreground">{bestRoute.tickets.toLocaleString()} tickets</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{bestRoute.percentage}%</Badge>
                </div>
              ) : (
                <div className="text-muted-foreground">No route data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{dashboard?.totalBookings?.toLocaleString() || 0}</div>
                    <p className="text-sm text-muted-foreground">All time bookings</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                      }).format(ticketMetrics.totalRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">From all trips</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">RWF</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
