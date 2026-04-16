import { cn } from '@/lib/utils/cn'

interface SettingsCardProps {
  title: string
  children: React.ReactNode
  className?: string
  /** Tint the card for destructive actions (sign out, delete) */
  destructive?: boolean
}

export function SettingsCard({ title, children, className, destructive }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-card',
        destructive
          ? 'border-danger/20 bg-danger-light/20'
          : 'border-border bg-card',
        className,
      )}
    >
      <div
        className={cn(
          'border-b px-4 py-3 text-sm font-semibold',
          destructive
            ? 'border-danger/10 text-danger'
            : 'border-border/60 text-foreground',
        )}
      >
        {title}
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  )
}
