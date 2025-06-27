"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Phone, Mail, MoreHorizontal, Eye, Edit, Users, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const workerData = [
  {
    id: "W-001",
    name: "Emma Thompson",
    email: "emma.thompson@email.com",
    phone: "+1 (555) 111-2222",
    role: "Ticket Agent",
    department: "Operations",
    location: "Downtown Terminal",
    status: "active",
    shiftStart: "08:00",
    shiftEnd: "16:00",
    hireDate: "2022-03-15",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "W-002",
    name: "David Martinez",
    email: "david.martinez@email.com",
    phone: "+1 (555) 222-3333",
    role: "Maintenance Supervisor",
    department: "Maintenance",
    location: "Maintenance Depot",
    status: "active",
    shiftStart: "07:00",
    shiftEnd: "15:00",
    hireDate: "2021-08-20",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "W-003",
    name: "Jennifer Lee",
    email: "jennifer.lee@email.com",
    phone: "+1 (555) 333-4444",
    role: "Customer Service Rep",
    department: "Customer Service",
    location: "Main Office",
    status: "active",
    shiftStart: "09:00",
    shiftEnd: "17:00",
    hireDate: "2023-01-10",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "W-004",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@email.com",
    phone: "+1 (555) 444-5555",
    role: "Security Officer",
    department: "Security",
    location: "Central Station",
    status: "active",
    shiftStart: "22:00",
    shiftEnd: "06:00",
    hireDate: "2022-11-05",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "W-005",
    name: "Amanda White",
    email: "amanda.white@email.com",
    phone: "+1 (555) 555-6666",
    role: "Dispatcher",
    department: "Operations",
    location: "Control Center",
    status: "inactive",
    shiftStart: "16:00",
    shiftEnd: "00:00",
    hireDate: "2020-06-12",
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "W-006",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+1 (555) 666-7777",
    role: "Mechanic",
    department: "Maintenance",
    location: "Maintenance Depot",
    status: "active",
    shiftStart: "15:00",
    shiftEnd: "23:00",
    hireDate: "2021-12-03",
    avatar: "/placeholder-user.jpg",
  },
]

const roleColors = {
  "Ticket Agent": "bg-blue-100 text-blue-800",
  "Maintenance Supervisor": "bg-orange-100 text-orange-800",
  "Customer Service Rep": "bg-green-100 text-green-800",
  "Security Officer": "bg-red-100 text-red-800",
  Dispatcher: "bg-purple-100 text-purple-800",
  Mechanic: "bg-yellow-100 text-yellow-800",
}

export default function WorkersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [workers, setWorkers] = useState(workerData)

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleWorkerStatus = (workerId: string) => {
    setWorkers(
      workers.map((worker) =>
        worker.id === workerId ? { ...worker, status: worker.status === "active" ? "inactive" : "active" } : worker,
      ),
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getDepartmentStats = () => {
    const departments = workers.reduce(
      (acc, worker) => {
        acc[worker.department] = (acc[worker.department] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return departments
  }

  const departmentStats = getDepartmentStats()

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Worker Management</h1>
            <p className="text-sm text-muted-foreground">Manage your support staff and workers</p>
          </div>
          <Button>Add New Worker</Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workers.filter((w) => w.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(departmentStats).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {workers.filter((w) => w.status === "inactive").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>Worker distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(departmentStats).map(([department, count]) => (
                <div key={department} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{department}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workers List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Staff Directory</CardTitle>
                <CardDescription>Manage worker profiles and assignments</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={worker.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(worker.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-sm text-muted-foreground">{worker.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{worker.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{worker.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={roleColors[worker.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}
                      >
                        {worker.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{worker.department}</TableCell>
                    <TableCell className="text-sm">{worker.location}</TableCell>
                    <TableCell className="text-sm">
                      {worker.shiftStart} - {worker.shiftEnd}
                    </TableCell>
                    <TableCell className="text-sm">{worker.hireDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={worker.status === "active" ? "default" : "secondary"}>{worker.status}</Badge>
                        <Switch
                          checked={worker.status === "active"}
                          onCheckedChange={() => toggleWorkerStatus(worker.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
