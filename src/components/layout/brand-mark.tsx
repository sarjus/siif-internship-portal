import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandMark ({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-3', className)}>
      <span className="inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm">
        <Image src="/College Logo.png" alt="College logo" width={340} height={108} className="h-16 w-auto object-contain" />
        <span className="h-14 w-px bg-slate-200" />
        <Image src="/SIIF Website.png" alt="SIIF website logo" width={96} height={96} className="h-16 w-16 rounded-full object-contain" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-[0.2em] text-slate-300">INTERNx SIIF</span>
        <span className="text-lg font-bold text-white group-hover:text-sky-200">Intership Portal</span>
      </span>
    </Link>
  )
}
