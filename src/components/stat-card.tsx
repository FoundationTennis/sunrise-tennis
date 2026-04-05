import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  label: string
  value: string
  href?: string
  icon?: LucideIcon
  variant?: 'default' | 'danger' | 'success'
}

export function StatCard({ label, value, href, icon: Icon, variant = 'default' }: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:scale-[1.01] press-scale">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-blue">{label}</p>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
        )}
      </div>
      <p className={cn(
        'mt-2 text-3xl font-bold tracking-tight',
        variant === 'danger' && 'text-danger',
        variant === 'success' && 'text-success',
        variant === 'default' && 'text-deep-navy',
      )}>
        {value}
      </p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
