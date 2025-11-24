"use client"

import { useReverseGeocode } from "@/hooks/use-reverse-geocode"
import { Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface LocationAddressProps {
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  className?: string
  showLoadingIcon?: boolean
  truncate?: boolean
  speed?: number | null
  nextWaypoint?: {
    name: string
    remainingDistance?: number | null
  } | null
  completionTime?: string | null
  status?: string
}

/**
 * Extracts a shorter, more readable address from the full display_name
 * Example: "Nyabugogo Bus Station, KN 1 Rd, Kimisagara, Nyarugenge District, Kigali City, Rwanda"
 * Returns: "Nyabugogo Bus Station"
 */
function extractShortAddress(fullAddress: string): string {
  if (!fullAddress || fullAddress === "Unknown" || fullAddress === "Querying location...") {
    return fullAddress
  }

  // Split by comma and take the first part (usually the most specific location name)
  const parts = fullAddress.split(",")
  if (parts.length > 0) {
    return parts[0].trim()
  }

  return fullAddress
}

export function LocationAddress({
  latitude,
  longitude,
  address,
  className = "",
  showLoadingIcon = false,
  truncate = false,
  speed,
  nextWaypoint,
  completionTime,
  status,
}: LocationAddressProps) {
  const { address: resolvedAddress, isLoading } = useReverseGeocode(
    latitude,
    longitude,
    address
  )

  const displayText = truncate 
    ? extractShortAddress(resolvedAddress)
    : resolvedAddress

  const hasCoordinates = latitude != null && longitude != null
  const fullAddressText = resolvedAddress !== "Unknown" && resolvedAddress !== "Querying location..."
    ? resolvedAddress
    : "Location unknown"
  
  // Build tooltip content based on status and available data
  const tooltipParts: string[] = []
  
  if (fullAddressText !== "Location unknown") {
    tooltipParts.push(fullAddressText)
  }
  
  if (hasCoordinates) {
    tooltipParts.push(`\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
  }
  
  if (speed != null && speed > 0) {
    tooltipParts.push(`\nSpeed: ${speed.toFixed(1)} km/h`)
  }
  
  // For in_progress trips, show next waypoint with remaining distance
  if (status === "in_progress" || status === "ongoing" || status === "IN_PROGRESS") {
    if (nextWaypoint?.name) {
      const distanceText = nextWaypoint.remainingDistance != null
        ? `${(nextWaypoint.remainingDistance / 1000).toFixed(2)} km`
        : "Distance unknown"
      tooltipParts.push(`\n\nNext: ${nextWaypoint.name}`)
      tooltipParts.push(`Remaining: ${distanceText}`)
    }
  }
  
  // For completed trips, show completion time
  if (status === "completed" && completionTime) {
    const completionDate = new Date(completionTime)
    tooltipParts.push(`\n\nCompleted: ${completionDate.toLocaleString()}`)
  }
  
  const tooltipContent = tooltipParts.join("") || fullAddressText

  if (isLoading && showLoadingIcon) {
    return (
      <span className={`${className} flex items-center gap-1 whitespace-nowrap`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Querying location...
      </span>
    )
  }

  const content = (
    <span 
      className={`${className} ${truncate ? "block overflow-x-auto overflow-y-hidden scrollbar-hide whitespace-nowrap" : ""}`}
      style={truncate ? { 
        maxWidth: "100%",
      } : {}}
    >
      {displayText}
    </span>
  )

  // If truncating and we have content to show in tooltip, wrap in tooltip
  if (truncate && resolvedAddress !== "Unknown" && resolvedAddress !== "Querying location...") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-words whitespace-pre-line text-left">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

