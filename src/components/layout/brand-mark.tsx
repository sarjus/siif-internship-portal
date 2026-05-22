import Link from 'next/link'
import { cn } from '@/lib/utils'

export function BrandMark ({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-3', className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sm font-bold text-sky-200 shadow-glow">
        SIIF
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Internship</span>
        <span className="text-lg font-bold text-white group-hover:text-sky-200">Portal</span>
      </span>
    </Link>
  )
}
