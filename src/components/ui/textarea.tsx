import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea ({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-32 w-full rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 shadow-sm transition-colors focus-visible:border-aurora-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
