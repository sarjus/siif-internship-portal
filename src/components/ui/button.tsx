import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-aurora-500 text-white shadow-glow hover:bg-aurora-400',
  secondary: 'bg-slate-100/10 text-slate-100 hover:bg-slate-100/15 border border-slate-200/10',
  outline: 'border border-slate-200/15 text-slate-100 hover:bg-slate-100/8',
  ghost: 'text-slate-200 hover:bg-slate-100/8 hover:text-white',
  destructive: 'bg-rose-500 text-white hover:bg-rose-400'
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button (
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
})

export { Button }
