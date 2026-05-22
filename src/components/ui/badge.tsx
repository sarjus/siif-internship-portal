import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'muted'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100/10 text-slate-100 border border-slate-200/10',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
  info: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
  muted: 'bg-slate-500/15 text-slate-300 border border-slate-400/15'
}

export function Badge ({ className, variant = 'default', children }: React.PropsWithChildren<{ className?: string; variant?: BadgeVariant }>) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variantStyles[variant], className)}>{children}</span>
}
