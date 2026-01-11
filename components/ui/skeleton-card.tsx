import { Skeleton } from './skeleton'

export function SkeletonCard() {
  return (
    <div className="p-4 bg-card rounded-lg border border-border space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function SkeletonTripCard() {
  return (
    <div className="p-4 bg-card rounded-lg border border-border space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function SkeletonBookingSummary() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-card rounded-lg border border-border space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="p-3 bg-card rounded-lg border border-border space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-card rounded-lg border border-border space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="p-3 bg-card rounded-lg border border-border space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTripHistoryList() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32 mb-4" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-3 bg-card rounded-lg border border-border space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonLoginForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
