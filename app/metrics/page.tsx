"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { LegendPayload } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCompanyMetrics } from "@/hooks/use-company-metrics"
import { useIsMobile } from "@/hooks/use-mobile"
import { TrendingUp, DollarSign, Car, Users, Clock, MapPin } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const TIME_RANGES = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last Year", value: "year" },
]

function getTimeRangeDates(range: string): { startTime: number | null; endTime: number | null } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today (23:59:59)
  
  switch (range) {
    case "today":
      return {
        startTime: Math.floor(today.getTime() / 1000),
        endTime: Math.floor(endOfToday.getTime() / 1000),
      }
    case "week":
      // Last 7 days (including today) - go backward 6 days from today
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 6)
      return {
        startTime: Math.floor(weekStart.getTime() / 1000),
        endTime: Math.floor(endOfToday.getTime() / 1000),
      }
    case "month":
      // Last 30 days (including today) - go backward 29 days from today
      const monthStart = new Date(today)
      monthStart.setDate(today.getDate() - 29)
      return {
        startTime: Math.floor(monthStart.getTime() / 1000),
        endTime: Math.floor(endOfToday.getTime() / 1000),
      }
    case "year":
      // Last 365 days (including today) - go backward 364 days from today
      const yearStart = new Date(today)
      yearStart.setDate(today.getDate() - 364)
      return {
        startTime: Math.floor(yearStart.getTime() / 1000),
        endTime: Math.floor(endOfToday.getTime() / 1000),
      }
    default:
      return { startTime: null, endTime: null }
  }
}

export default function MetricsPage() {
  const { user } = useAuth()
  const [selectedRange, setSelectedRange] = useState("today")
  const isMobile = useIsMobile()
  const [windowWidth, setWindowWidth] = useState<number>(0)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    handleResize() // Set initial width
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Determine screen size category
  const isSmallScreen = windowWidth > 0 && windowWidth < 640 // sm breakpoint
  const isMediumScreen = windowWidth >= 640 && windowWidth < 1024 // md breakpoint

  const { startTime, endTime } = useMemo(() => {
    return getTimeRangeDates(selectedRange)
  }, [selectedRange])

  const { metrics, loading, error } = useCompanyMetrics(user?.companyId, startTime, endTime)

  // Prepare status data for pie chart
  const statusData = useMemo(() => {
    if (!metrics?.tripsByStatus) return []
    return [
      { name: "Completed", value: metrics.tripsByStatus.completed, color: COLORS[1] },
      { name: "Cancelled", value: metrics.tripsByStatus.cancelled, color: COLORS[2] },
      { name: "In Progress", value: metrics.tripsByStatus.in_progress, color: COLORS[0] },
      { name: "Scheduled", value: metrics.tripsByStatus.scheduled, color: COLORS[3] },
    ].filter((item) => item.value > 0)
  }, [metrics])

  // Helper function to format labels based on granularity and prevent overlapping
  const formatLabel = (label: string, granularity?: string): string => {
    if (granularity === "monthly" || granularity === "month") {
      // Try to parse month name and convert to short format
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
      const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      
      // Check if label contains a month name
      const monthIndex = monthNames.findIndex(month => 
        label.toLowerCase().includes(month.toLowerCase())
      )
      
      if (monthIndex !== -1) {
        // Replace full month name with short version
        return label.replace(monthNames[monthIndex], shortMonthNames[monthIndex])
      }
      
      // Try to extract month number if format is like "2024-01" or "01/2024"
      const monthMatch = label.match(/(?:^|\D)(\d{1,2})(?:\D|$)/)
      if (monthMatch) {
        const monthNum = parseInt(monthMatch[1])
        if (monthNum >= 1 && monthNum <= 12) {
          // Return just the month number
          return monthNum.toString()
        }
      }
      
      // If we can't parse, try to extract first 3 letters
      const words = label.split(/\s+/)
      if (words.length > 0) {
        const firstWord = words[0]
        if (firstWord.length > 3) {
          return firstWord.substring(0, 3)
        }
        return firstWord
      }
    }
    
    // Handle daily/hourly labels - extract just the essential part
    if (granularity === "daily" || granularity === "day" || granularity === "hourly" || granularity === "hour") {
      // If it's a date string, try to extract just the day or hour
      // Format like "2024-01-15" -> "15" or "Mon 15" -> "15" or "09:00" -> "09"
      const dayMatch = label.match(/(\d{1,2})(?:\s|$|:)/)
      if (dayMatch) {
        return dayMatch[1]
      }
      // If it's a day name, use abbreviation
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const shortDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const dayIndex = dayNames.findIndex(day => 
        label.toLowerCase().includes(day.toLowerCase())
      )
      if (dayIndex !== -1) {
        return shortDayNames[dayIndex]
      }
    }
    
    // For weekly labels, extract day abbreviation
    if (granularity === "weekly" || granularity === "week") {
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const shortDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const dayIndex = dayNames.findIndex(day => 
        label.toLowerCase().includes(day.toLowerCase())
      )
      if (dayIndex !== -1) {
        return shortDayNames[dayIndex]
      }
      // If it contains a date, extract just the day number
      const dayMatch = label.match(/(\d{1,2})(?:\s|$)/)
      if (dayMatch) {
        return dayMatch[1]
      }
    }
    
    // Default: truncate long labels
    if (label.length > 8) {
      return label.substring(0, 8) + "..."
    }
    
    return label
  }
  
  // Calculate optimal interval for XAxis based on data length and screen size
  const getXAxisInterval = (dataLength: number, isSmall: boolean, isMedium: boolean): number | "preserveStartEnd" => {
    if (isSmall) {
      // On small screens, show fewer labels
      if (dataLength <= 7) return 0
      if (dataLength <= 14) return 1
      return Math.ceil(dataLength / 7)
    }
    if (isMedium) {
      if (dataLength <= 10) return 0
      if (dataLength <= 20) return 1
      return Math.ceil(dataLength / 10)
    }
    // On large screens, show more labels
    if (dataLength <= 15) return 0
    if (dataLength <= 30) return 1
    return Math.ceil(dataLength / 15)
  }

  // Format revenue series data
  const revenueChartData = useMemo(() => {
    if (!metrics?.revenueSeries?.data) return []
    const granularity = metrics.revenueSeries.granularity
    return metrics.revenueSeries.data.map((point) => ({
      label: formatLabel(point.label, granularity),
      revenue: point.value,
      fullLabel: point.label, // Keep original for tooltip
    }))
  }, [metrics])

  // Format trips series data
  const tripsChartData = useMemo(() => {
    if (!metrics?.tripsSeries?.data) return []
    const granularity = metrics.tripsSeries.granularity
    return metrics.tripsSeries.data.map((point) => ({
      label: formatLabel(point.label, granularity),
      trips: point.value,
      fullLabel: point.label, // Keep original for tooltip
    }))
  }, [metrics])
  
  // Get XAxis interval for revenue chart
  const revenueXAxisInterval = useMemo(() => 
    getXAxisInterval(revenueChartData.length, isSmallScreen, isMediumScreen),
    [revenueChartData.length, isSmallScreen, isMediumScreen]
  )
  
  // Get XAxis interval for trips chart
  const tripsXAxisInterval = useMemo(() => 
    getXAxisInterval(tripsChartData.length, isSmallScreen, isMediumScreen),
    [tripsChartData.length, isSmallScreen, isMediumScreen]
  )

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between flex-wrap gap-2">
          <div className="min-w-0">
            <h1 className={`font-semibold ${
              isSmallScreen ? "text-base" : 
              isMediumScreen ? "text-lg" : 
              "text-lg"
            }`}>Company Metrics</h1>
            <p className={`text-muted-foreground ${
              isSmallScreen ? "text-xs" : 
              "text-sm"
            }`}>Track performance and analytics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className={
                isSmallScreen ? "w-[140px] text-xs" : 
                isMediumScreen ? "w-[160px] text-sm" : 
                "w-[180px]"
              }>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Error loading metrics data. Please try again later.</p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.totalTrips?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">All trips in period</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
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
                    }).format(metrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total earnings</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.uniqueDrivers || 0}</div>
                  <p className="text-xs text-muted-foreground">Active drivers</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Cars</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.uniqueCars || 0}</div>
                  <p className="text-xs text-muted-foreground">Active vehicles</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trip Status Breakdown */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status Breakdown</CardTitle>
              <CardDescription>Distribution of trips by status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className={
                  isSmallScreen ? "h-[250px] w-full" : 
                  isMediumScreen ? "h-[280px] w-full" : 
                  "h-[300px] w-full"
                } />
              ) : statusData.length === 0 ? (
                <div className={`flex items-center justify-center text-muted-foreground ${
                  isSmallScreen ? "h-[250px]" : 
                  isMediumScreen ? "h-[280px]" : 
                  "h-[300px]"
                }`}>
                  No trip data available
                </div>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Trips",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className={
                    isSmallScreen ? "h-[250px]" : 
                    isMediumScreen ? "h-[280px]" : 
                    "h-[300px]"
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy={isSmallScreen ? "45%" : isMediumScreen ? "47%" : "50%"}
                        labelLine={false}
                        label={
                          isSmallScreen ? false : 
                          isMediumScreen ? ({ name, value }) => `${name}: ${value}` :
                          ({ name, value, percent }) => {
                            const percentage = percent ? (percent * 100).toFixed(0) : 0
                            return `${name}\n${value} (${percentage}%)`
                          }
                        }
                        outerRadius={
                          isSmallScreen ? 60 : 
                          isMediumScreen ? 75 : 
                          90
                        }
                        innerRadius={isSmallScreen ? 20 : isMediumScreen ? 25 : 30}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign={isSmallScreen ? "bottom" : "middle"}
                        align={isSmallScreen ? "center" : "right"}
                        layout={isSmallScreen ? "horizontal" : "vertical"}
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: isSmallScreen ? "10px" : isMediumScreen ? "11px" : "12px",
                          paddingTop: isSmallScreen ? "10px" : "0"
                        }}
                        formatter={(value, entry: LegendPayload) => {
                          const total = statusData.reduce((sum, item) => sum + item.value, 0)
                          const entryValue = (entry.payload?.value as number) || 0
                          const percent = total > 0 ? ((entryValue / total) * 100).toFixed(0) : 0
                          return (
                            <span style={{ color: entry.color }}>
                              {value}: {entryValue} ({percent}%)
                            </span>
                          )
                        }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: number, name: string) => {
                          const total = statusData.reduce((sum, item) => sum + item.value, 0)
                          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                          return [`${value} trips (${percent}%)`, name]
                        }}
                        wrapperStyle={{ 
                          fontSize: isSmallScreen ? "11px" : 
                                   isMediumScreen ? "12px" : 
                                   "14px" 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Summary</CardTitle>
              <CardDescription>Detailed trip status counts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>Completed</span>
                    </div>
                    <div className={`font-bold text-green-700 ${isMobile ? "text-xl" : "text-2xl"}`}>
                      {metrics?.tripsByStatus?.completed || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>In Progress</span>
                    </div>
                    <div className={`font-bold text-blue-700 ${isMobile ? "text-xl" : "text-2xl"}`}>
                      {metrics?.tripsByStatus?.in_progress || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>Scheduled</span>
                    </div>
                    <div className={`font-bold text-yellow-700 ${isMobile ? "text-xl" : "text-2xl"}`}>
                      {metrics?.tripsByStatus?.scheduled || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>Cancelled</span>
                    </div>
                    <div className={`font-bold text-red-700 ${isMobile ? "text-xl" : "text-2xl"}`}>
                      {metrics?.tripsByStatus?.cancelled || 0}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Trips Charts */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Revenue over time ({metrics?.revenueSeries?.granularity || "N/A"})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className={
                  isSmallScreen ? "h-[250px] w-full" : 
                  isMediumScreen ? "h-[280px] w-full" : 
                  "h-[300px] w-full"
                } />
              ) : revenueChartData.length === 0 ? (
                <div className={`flex items-center justify-center text-muted-foreground ${
                  isSmallScreen ? "h-[250px]" : 
                  isMediumScreen ? "h-[280px]" : 
                  "h-[300px]"
                }`}>
                  No revenue data available
                </div>
              ) : (
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className={
                    isSmallScreen ? "h-[250px]" : 
                    isMediumScreen ? "h-[280px]" : 
                    "h-[300px]"
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={revenueChartData} 
                      margin={
                        isSmallScreen ? { top: 10, right: 10, left: 0, bottom: 60 } : 
                        isMediumScreen ? { top: 10, right: 15, left: 5, bottom: 70 } : 
                        { top: 10, right: 20, left: 10, bottom: 80 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="label" 
                        tick={{ 
                          fontSize: isSmallScreen ? 8 : 
                                  isMediumScreen ? 9 : 
                                  11,
                          fill: "hsl(var(--muted-foreground))"
                        }}
                        angle={isSmallScreen ? -45 : isMediumScreen ? -35 : -25}
                        textAnchor={isSmallScreen || isMediumScreen ? "end" : "end"}
                        height={isSmallScreen ? 60 : isMediumScreen ? 70 : 80}
                        interval={revenueXAxisInterval}
                        minTickGap={isSmallScreen ? 5 : isMediumScreen ? 8 : 10}
                        tickMargin={8}
                        label={{ 
                          value: metrics?.revenueSeries?.granularity ? 
                            `Time (${metrics.revenueSeries.granularity})` : "Time",
                          position: "insideBottom",
                          offset: -5,
                          style: { textAnchor: "middle", fill: "hsl(var(--foreground))", fontSize: isSmallScreen ? 10 : 12 }
                        }}
                      />
                      <YAxis 
                        tick={{ 
                          fontSize: isSmallScreen ? 9 : 
                                  isMediumScreen ? 10 : 
                                  11,
                          fill: "hsl(var(--muted-foreground))"
                        }}
                        width={isSmallScreen ? 50 : isMediumScreen ? 60 : 70}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                          return value.toString()
                        }}
                        label={{ 
                          value: "Revenue (RWF)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "hsl(var(--foreground))", fontSize: isSmallScreen ? 10 : 12 }
                        }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: number) =>
                          new Intl.NumberFormat("en-RW", {
                            style: "currency",
                            currency: "RWF",
                          }).format(value)
                        }
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload
                          return data?.fullLabel || label
                        }}
                        wrapperStyle={{ 
                          fontSize: isSmallScreen ? "11px" : 
                                   isMediumScreen ? "12px" : 
                                   "14px" 
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        strokeWidth={isSmallScreen ? 1.5 : isMediumScreen ? 1.8 : 2}
                        dot={false}
                        activeDot={{ r: isSmallScreen ? 4 : isMediumScreen ? 5 : 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trips Trend</CardTitle>
              <CardDescription>
                Number of trips over time ({metrics?.tripsSeries?.granularity || "N/A"})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className={
                  isSmallScreen ? "h-[250px] w-full" : 
                  isMediumScreen ? "h-[280px] w-full" : 
                  "h-[300px] w-full"
                } />
              ) : tripsChartData.length === 0 ? (
                <div className={`flex items-center justify-center text-muted-foreground ${
                  isSmallScreen ? "h-[250px]" : 
                  isMediumScreen ? "h-[280px]" : 
                  "h-[300px]"
                }`}>
                  No trips data available
                </div>
              ) : (
                <ChartContainer
                  config={{
                    trips: {
                      label: "Trips",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className={
                    isSmallScreen ? "h-[250px]" : 
                    isMediumScreen ? "h-[280px]" : 
                    "h-[300px]"
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={tripsChartData} 
                      margin={
                        isSmallScreen ? { top: 10, right: 10, left: 0, bottom: 60 } : 
                        isMediumScreen ? { top: 10, right: 15, left: 5, bottom: 70 } : 
                        { top: 10, right: 20, left: 10, bottom: 80 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="label" 
                        tick={{ 
                          fontSize: isSmallScreen ? 8 : 
                                  isMediumScreen ? 9 : 
                                  11,
                          fill: "hsl(var(--muted-foreground))"
                        }}
                        angle={isSmallScreen ? -45 : isMediumScreen ? -35 : -25}
                        textAnchor={isSmallScreen || isMediumScreen ? "end" : "end"}
                        height={isSmallScreen ? 60 : isMediumScreen ? 70 : 80}
                        interval={tripsXAxisInterval}
                        minTickGap={isSmallScreen ? 5 : isMediumScreen ? 8 : 10}
                        tickMargin={8}
                        label={{ 
                          value: metrics?.tripsSeries?.granularity ? 
                            `Time (${metrics.tripsSeries.granularity})` : "Time",
                          position: "insideBottom",
                          offset: -5,
                          style: { textAnchor: "middle", fill: "hsl(var(--foreground))", fontSize: isSmallScreen ? 10 : 12 }
                        }}
                      />
                      <YAxis 
                        tick={{ 
                          fontSize: isSmallScreen ? 9 : 
                                  isMediumScreen ? 10 : 
                                  11,
                          fill: "hsl(var(--muted-foreground))"
                        }}
                        width={isSmallScreen ? 50 : isMediumScreen ? 60 : 70}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                          return value.toString()
                        }}
                        label={{ 
                          value: "Number of Trips",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "hsl(var(--foreground))", fontSize: isSmallScreen ? 10 : 12 }
                        }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload
                          return data?.fullLabel || label
                        }}
                        wrapperStyle={{ 
                          fontSize: isSmallScreen ? "11px" : 
                                   isMediumScreen ? "12px" : 
                                   "14px" 
                        }}
                      />
                      <Bar 
                        dataKey="trips" 
                        fill="var(--color-trips)"
                        radius={
                          isSmallScreen ? [3, 3, 0, 0] : 
                          isMediumScreen ? [4, 4, 0, 0] : 
                          [6, 6, 0, 0]
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Distance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {((metrics?.averageTripDistance || 0) / 1000).toFixed(2)} km
                    </div>
                    <p className="text-sm text-muted-foreground">Per trip</p>
                  </div>
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round((metrics?.averageTripDuration || 0) / 60)} min
                    </div>
                    <p className="text-sm text-muted-foreground">Per trip</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue from Completed</CardTitle>
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
                      }).format(metrics?.revenueFromCompletedTrips || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed trips only</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}



