import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'muted'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
  muted: 'bg-slate-100 text-slate-600 border border-slate-200'
}

export function Badge ({ className, variant = 'default', children }: React.PropsWithChildren<{ className?: string; variant?: BadgeVariant }>) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variantStyles[variant], className)}>{children}</span>
}
