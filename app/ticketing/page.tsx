"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, TrendingUp, DollarSign, Ticket, Download, Filter } from "lucide-react"
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

// Sample data for charts
const dailySalesData = [
  { day: "Mon", tickets: 245, revenue: 1225 },
  { day: "Tue", tickets: 312, revenue: 1560 },
  { day: "Wed", tickets: 189, revenue: 945 },
  { day: "Thu", tickets: 278, revenue: 1390 },
  { day: "Fri", tickets: 356, revenue: 1780 },
  { day: "Sat", tickets: 423, revenue: 2115 },
  { day: "Sun", tickets: 298, revenue: 1490 },
]

const monthlySalesData = [
  { month: "Jan", tickets: 8450, revenue: 42250 },
  { month: "Feb", tickets: 7890, revenue: 39450 },
  { month: "Mar", tickets: 9120, revenue: 45600 },
  { month: "Apr", tickets: 8760, revenue: 43800 },
  { month: "May", tickets: 9340, revenue: 46700 },
  { month: "Jun", tickets: 10120, revenue: 50600 },
]

const routeData = [
  { route: "Route A", tickets: 1250, percentage: 28 },
  { route: "Route B", tickets: 980, percentage: 22 },
  { route: "Route C", tickets: 850, percentage: 19 },
  { route: "Route D", tickets: 720, percentage: 16 },
  { route: "Route E", tickets: 650, percentage: 15 },
]

const hourlyData = [
  { hour: "06:00", tickets: 45 },
  { hour: "07:00", tickets: 120 },
  { hour: "08:00", tickets: 180 },
  { hour: "09:00", tickets: 95 },
  { hour: "10:00", tickets: 65 },
  { hour: "11:00", tickets: 75 },
  { hour: "12:00", tickets: 110 },
  { hour: "13:00", tickets: 85 },
  { hour: "14:00", tickets: 90 },
  { hour: "15:00", tickets: 125 },
  { hour: "16:00", tickets: 160 },
  { hour: "17:00", tickets: 195 },
  { hour: "18:00", tickets: 175 },
  { hour: "19:00", tickets: 140 },
  { hour: "20:00", tickets: 95 },
  { hour: "21:00", tickets: 60 },
  { hour: "22:00", tickets: 35 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function TicketingPage() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Ticketing Analytics</h1>
            <p className="text-sm text-muted-foreground">Track sales performance and revenue metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
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
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$6,235</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,901</div>
              <p className="text-xs text-muted-foreground">tickets sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average per Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,272</div>
              <p className="text-xs text-muted-foreground">tickets per day</p>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Route Rankings</CardTitle>
                  <CardDescription>Top performing routes by ticket sales</CardDescription>
                </CardHeader>
                <CardContent>
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">Route A</div>
                  <p className="text-sm text-muted-foreground">1,250 tickets this week</p>
                </div>
                <Badge className="bg-green-100 text-green-800">+15%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peak Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">17:00</div>
                  <p className="text-sm text-muted-foreground">195 tickets average</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Rush Hour</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">+12.5%</div>
                  <p className="text-sm text-muted-foreground">vs last month</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Growing</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
