"use client"

import { useState, useEffect, useRef } from "react"
import { Activity } from "lucide-react"
import { formatSpeed, formatBearing, reverseGeocode } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SpeedBearingDisplayProps {
  speed?: number
  bearing?: number
  position?: [number, number]
  className?: string
  iconSize?: string
  compact?: boolean
}

export default function SpeedBearingDisplay({
  speed,
  bearing,
  position,
  className = "",
  iconSize = "w-5 h-5",
  compact = false,
}: SpeedBearingDisplayProps) {
  const [location, setLocation] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedRef = useRef(false)

  const handleMouseEnter = () => {
    if (!position || hasLoadedRef.current) return

    hoverTimerRef.current = setTimeout(async () => {
      setIsLoadingLocation(true)
      const locationName = await reverseGeocode(position[0], position[1])
      setLocation(locationName)
      setIsLoadingLocation(false)
      hasLoadedRef.current = true
    }, 3000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  const displayContent = (
    <div
      className={`${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {compact ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Speed</p>
            <p className="text-2xl font-bold">{formatSpeed(speed)} km/h</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Heading</p>
            <p className="text-2xl font-bold">{formatBearing(bearing)}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-lg">
            <Activity className={iconSize + " text-muted-foreground"} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Speed / Bearing</p>
            <p className="font-semibold">
              {formatSpeed(speed)} km/h • {formatBearing(bearing)}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  if (!position || (position[0] === 0 && position[1] === 0)) {
    return displayContent
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isLoadingLocation || location !== null}>
        <TooltipTrigger asChild>
          {displayContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isLoadingLocation ? "Loading location..." : location || "Location unavailable"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
