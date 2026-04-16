import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SettingsRowProps {
  icon: React.ReactNode
  label: string
  /** Secondary text shown below the label */
  description?: string
  /** Right-side control (toggle, badge, value text) */
  control?: React.ReactNode
  /** When provided, the row becomes a link with a chevron */
  chevronHref?: string
  /** When provided, the row becomes a button that calls this handler */
  onClick?: () => void
  /** Tint the row for destructive actions */
  destructive?: boolean
  className?: string
}

export function SettingsRow({
  icon,
  label,
  description,
  control,
  chevronHref,
  onClick,
  destructive,
  className,
}: SettingsRowProps) {
  const content = (
    <>
      {/* Icon pill */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          destructive ? 'bg-danger-light text-danger' : 'bg-primary/10 text-primary',
        )}
      >
        {icon}
      </div>

      {/* Label + description */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            destructive ? 'text-danger' : 'text-foreground',
          )}
        >
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Right side: control or chevron */}
      {control && <div className="shrink-0">{control}</div>}
      {chevronHref && !control && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
      )}
      {onClick && !control && !chevronHref && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  )

  const baseClass = cn(
    'group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
    className,
  )

  if (chevronHref) {
    return (
      <Link href={chevronHref} className={baseClass}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, 'w-full text-left')}>
        {content}
      </button>
    )
  }

  return <div className={baseClass}>{content}</div>
}
