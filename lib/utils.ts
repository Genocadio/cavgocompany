import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats speed in km/h according to display rules:
// - Speeds below 1 km/h are shown as 0
// - Otherwise, round to one decimal place
// - Omit trailing .0 (show integers without decimal)
export function formatSpeed(speed?: number | null): string {
  if (speed == null || isNaN(speed)) return '0'
  if (speed < 1) return '0'
  const rounded = Math.round(speed * 10) / 10
  const asInt = Math.round(rounded)
  if (Math.abs(rounded - asInt) < 1e-9) {
    return String(asInt)
  }
  return rounded.toFixed(1)
}

// Reverse geocode a lat/lng to get the most specific location name
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )
    if (!response.ok) return null
    
    const data = await response.json()
    
    // Find the administrative entry with the highest order (most specific)
    const administrative = data?.localityInfo?.administrative || []
    if (administrative.length === 0) return null
    
    const mostSpecific = administrative.reduce((prev: any, current: any) => {
      return (current.order > prev.order) ? current : prev
    })
    
    return mostSpecific?.name || null
  } catch (error) {
    console.error('Reverse geocode failed:', error)
    return null
  }
}
