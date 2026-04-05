export default function ParentLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="h-[140px] rounded-2xl skeleton-shimmer" />

      {/* Quick actions */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-28 shrink-0 rounded-full skeleton-shimmer" />
        ))}
      </div>

      {/* Two column: Players + Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="h-6 w-28 rounded skeleton-shimmer" />
          <div className="h-16 rounded-xl skeleton-shimmer" />
          <div className="h-16 rounded-xl skeleton-shimmer" />
          <div className="h-16 rounded-xl skeleton-shimmer" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-36 rounded skeleton-shimmer" />
          <div className="h-16 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-32 rounded skeleton-shimmer" />
        <div className="h-48 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  )
}
