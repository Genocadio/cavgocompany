"use client"

import { Bus, BarChart3, UserCheck, Home, LogOut, Navigation, Calendar, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Buses",
    url: "/buses",
    icon: Bus,
  },
  {
    title: "Live Tracking",
    url: "/live-tracking",
    icon: Navigation,
  },
  {
    title: "Trips",
    url: "/trips",
    icon: Calendar,
  },
  {
    title: "Drivers",
    url: "/drivers",
    icon: UserCheck,
  },
  {
    title: "Metrics",
    url: "/metrics",
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const getInitials = (name: string) => {
    if (!name) return "U"
    
    const nameParts = name.trim().split(" ").filter((part) => part.length > 0)
    
    if (nameParts.length >= 2) {
      // Two or more names: first letter of first name + first letter of last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    } else if (nameParts.length === 1) {
      // Single name: first 2 letters
      const singleName = nameParts[0]
      return singleName.length >= 2 
        ? singleName.substring(0, 2).toUpperCase()
        : singleName[0].toUpperCase() + singleName[0].toUpperCase()
    }
    
    return "U"
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 md:justify-center lg:justify-start">
          <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
            <Image 
              src="/logo.webp" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <div className="flex flex-col md:hidden lg:flex">
            <span className="text-sm font-semibold">cavgoadmin</span>
            <span className="text-xs text-muted-foreground">{user?.companyName || "Company"}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex md:hidden lg:flex">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span className="inline md:hidden lg:inline">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] justify-start md:justify-center lg:justify-start"
                  aria-label="User menu"
                >
                  <Avatar className="flex-shrink-0 border-2 border-background shadow-sm h-8 w-8 md:h-8 md:w-8 lg:h-10 lg:w-10">
                    <AvatarImage src="/placeholder-user.jpg" alt={user?.name || user?.username || "User"} />
                    <AvatarFallback className="font-semibold bg-primary text-primary-foreground border-2 border-primary/20 text-xs md:text-xs lg:text-sm">
                      {getInitials(user?.name || user?.username || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0 md:hidden lg:flex">
                    <span className="text-sm font-medium truncate w-full">
                      {user?.name || user?.username || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user?.email || user?.role || ""}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" side="top">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name || user?.username || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
