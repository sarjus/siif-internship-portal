import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input ({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm transition-colors focus-visible:border-aurora-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aurora-500 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
})

export { Input }
