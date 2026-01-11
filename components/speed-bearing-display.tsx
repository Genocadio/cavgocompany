"use client"

import { useState, useEffect, useRef } from "react"
import { Activity, AlertCircle } from "lucide-react"
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

  const hasLocation = position && !(position[0] === 0 && position[1] === 0)

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
            <p className="text-2xl font-bold">{hasLocation ? formatSpeed(speed) : "_ _"} km/h</p>
          </div>
          <div className="flex items-center justify-center">
            {hasLocation ? (
              <div className="flex items-center justify-center w-8 h-8 text-lg font-extrabold text-muted-foreground">
                {formatBearing(bearing)}
              </div>
            ) : (
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-lg">
            {hasLocation ? (
              <div className="flex items-center justify-center w-5 h-5 text-sm font-extrabold text-muted-foreground">
                {formatBearing(bearing)}
              </div>
            ) : (
              <AlertCircle className={iconSize + " text-muted-foreground"} />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Speed</p>
            <p className="font-semibold">
              {hasLocation ? formatSpeed(speed) : "_ _"} km/h
            </p>
          </div>
        </div>
      )}
    </div>
  )

  if (!hasLocation) {
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
