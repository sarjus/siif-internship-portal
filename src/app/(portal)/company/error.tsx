'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function CompanyError ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Company portal error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-lg font-semibold text-slate-800">Something went wrong</p>
      <p className="max-w-sm text-sm text-slate-500">{error.message ?? 'An unexpected error occurred. Please try again.'}</p>
      <Button onClick={reset} variant="outline" size="sm">Try again</Button>
    </div>
  )
}
