'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ToastVariant = 'danger' | 'success' | 'warning' | 'info'

interface WarmToastProps {
  variant: ToastVariant
  children: React.ReactNode
  dismissible?: boolean
  className?: string
}

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: typeof AlertCircle
  bg: string
  text: string
  border: string
  iconColor: string
}> = {
  danger: {
    icon: AlertCircle,
    bg: 'bg-danger-light/60',
    text: 'text-danger',
    border: 'border-danger/20',
    iconColor: 'text-danger',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success-light/60',
    text: 'text-success',
    border: 'border-success/20',
    iconColor: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-light/60',
    text: 'text-warning',
    border: 'border-warning/20',
    iconColor: 'text-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-info-light/60',
    text: 'text-info',
    border: 'border-info/20',
    iconColor: 'text-info',
  },
}

export function WarmToast({ variant, children, dismissible = true, className }: WarmToastProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm',
        config.bg,
        config.text,
        config.border,
        className,
      )}
      role="alert"
    >
      <Icon className={cn('size-4 shrink-0', config.iconColor)} />
      <span className="flex-1">{children}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
