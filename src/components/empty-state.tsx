import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  illustration?: string
  title: string
  description: string
  action?: React.ReactNode
  compact?: boolean
}

export function EmptyState({ icon: Icon, illustration, title, description, action, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 shadow-card">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70">{description}</p>
        </div>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
      {illustration ? (
        <div className="relative mb-4 h-32 w-40">
          <Image
            src={illustration}
            alt=""
            fill
            className="object-contain"
            sizes="160px"
          />
        </div>
      ) : Icon ? (
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="size-6 text-primary/60" />
        </div>
      ) : null}
      <h3 className={cn('text-sm font-semibold text-foreground', illustration ? 'mt-1' : 'mt-4')}>{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
