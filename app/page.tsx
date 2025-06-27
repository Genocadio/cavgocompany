"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bus, Users, UserCheck, TrendingUp, DollarSign, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const statsCards = [
  {
    title: "Active Buses",
    value: "24",
    description: "Out of 30 total buses",
    icon: Bus,
    trend: "+2 from yesterday",
    color: "text-green-600",
  },
  {
    title: "Inactive Buses",
    value: "6",
    description: "Under maintenance",
    icon: Activity,
    trend: "-1 from yesterday",
    color: "text-red-600",
  },
  {
    title: "Active Drivers",
    value: "28",
    description: "Currently on duty",
    icon: UserCheck,
    trend: "+3 from yesterday",
    color: "text-blue-600",
  },
  {
    title: "Total Staff",
    value: "45",
    description: "Including drivers & workers",
    icon: Users,
    trend: "No change",
    color: "text-purple-600",
  },
  {
    title: "Today's Tickets",
    value: "1,247",
    description: "Tickets sold today",
    icon: TrendingUp,
    trend: "+12% from yesterday",
    color: "text-orange-600",
  },
  {
    title: "Today's Revenue",
    value: "$3,742",
    description: "Total earnings today",
    icon: DollarSign,
    trend: "+8% from yesterday",
    color: "text-green-600",
  },
]

const recentActivity = [
  { id: 1, action: "Bus B-001 went offline", time: "2 minutes ago", type: "warning" },
  { id: 2, action: "Driver John Smith started shift", time: "15 minutes ago", type: "success" },
  { id: 3, action: "Bus B-015 completed route", time: "32 minutes ago", type: "info" },
  { id: 4, action: "Maintenance scheduled for B-008", time: "1 hour ago", type: "warning" },
  { id: 5, action: "New driver Sarah Johnson added", time: "2 hours ago", type: "success" },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, John! Here&apos;s your fleet overview.</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            System Online
          </Badge>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.trend}</p>
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Buses</span>
                  <span>24/30 (80%)</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Driver Availability</span>
                  <span>28/32 (87.5%)</span>
                </div>
                <Progress value={87.5} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Route Coverage</span>
                  <span>18/20 (90%)</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-green-500"
                          : activity.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
