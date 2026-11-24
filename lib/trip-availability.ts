/**
 * Trip lifecycle states that exist in the trip service before Navigation has
 * created a live navigation session. The dashboard can still show trip details
 * from the subscription for these trips, but `/api/trips/{id}` (Navigation)
 * legitimately returns 404 until the driver starts the trip.
 */
const NOT_STARTED_STATUSES = new Set([
  "SCHEDULED",
  "PENDING",
  "NOT_STARTED",
  "NOTSTARTED",
  "CREATED",
  "DRAFT",
  "UPCOMING",
  "WAITING",
])

export function isTripNotStarted(status?: string | null): boolean {
  if (!status) return false
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, "_")
  return NOT_STARTED_STATUSES.has(normalized)
}

export interface TripMapUnavailableNotice {
  title: string
  description: string
}

/**
 * Message shown when Navigation has no data for a trip the dashboard already
 * knows about. A 404 is expected for scheduled/pending trips, so it must not be
 * presented as a broken map or a failed request.
 */
export function navigationUnavailableNotice(status?: string | null): TripMapUnavailableNotice {
  if (isTripNotStarted(status)) {
    return {
      title: "Trip hasn't started yet",
      description: "Live navigation becomes available once the driver starts this trip.",
    }
  }

  return {
    title: "Navigation data not available yet",
    description: "This trip hasn't appeared in Navigation yet. Live route data will show once it has started.",
  }
}
