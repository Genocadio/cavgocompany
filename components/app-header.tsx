"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { LayoutDashboard, MapIcon, Clock3, Moon, Sun } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"

interface AppHeaderProps {
  activeTab?: "management" | "map"
  onToggleView?: () => void
  showViewSwitcher?: boolean
}

export default function AppHeader({ activeTab = "management", onToggleView, showViewSwitcher = true }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const [currentTime, setCurrentTime] = useState("")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const getUserInitials = () => {
    if (!user?.username) return "U"
    const parts = user.username.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return user.username.slice(0, 2).toUpperCase()
  }

  return (
    <header className="h-16 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10 gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
          <Image src="/logo.webp" alt="Cavgo" width={32} height={32} priority />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {showViewSwitcher && onToggleView && (
          <button
            onClick={onToggleView}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors shadow-sm"
            title="Switch view"
          >
            {activeTab === "management" ? (
              <>
                <MapIcon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Map View</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Management</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border hidden sm:flex items-center gap-2">
          <Clock3 className="w-3.5 h-3.5" />
          {currentTime}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 border border-border bg-muted rounded-full overflow-hidden hover:border-primary/50 transition-colors">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[2001]">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="font-medium">{user?.username || "User"}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email || ""}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Dark / Light</span>
              {mounted && (theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
