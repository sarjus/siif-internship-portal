import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandMark ({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex max-w-full items-center gap-2 sm:gap-3', className)}>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm sm:gap-4 sm:px-5 sm:py-4">
        <Image src="/College Logo.png" alt="College logo" width={340} height={108} className="h-10 w-auto object-contain sm:h-16" />
        <span className="h-9 w-px bg-slate-200 sm:h-14" />
        <Image src="/SIIF Website.png" alt="SIIF website logo" width={96} height={96} className="h-10 w-10 rounded-full object-contain sm:h-16 sm:w-16" />
      </span>
      <span className="min-w-0 flex flex-col leading-tight">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-300 sm:text-sm sm:tracking-[0.2em]">INTERNx SIIF</span>
        <span className="text-sm font-bold text-white group-hover:text-sky-200 sm:text-lg">Intership Portal</span>
      </span>
    </Link>
  )
}
