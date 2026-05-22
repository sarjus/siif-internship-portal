import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input ({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white placeholder:text-slate-400 shadow-sm transition-colors focus-visible:border-aurora-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
})

export { Input }
