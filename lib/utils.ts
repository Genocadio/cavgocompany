import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts speed from meters per second (m/s) to kilometers per hour (km/h)
 * @param speedInMs - Speed in meters per second
 * @returns Speed in kilometers per hour, or 0 if speed is null/undefined
 */
export function convertMsToKmh(speedInMs: number | null | undefined): number {
  if (speedInMs == null || isNaN(speedInMs)) {
    return 0
  }
  return speedInMs * 3.6
}
