'use client'

import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DashboardListItem } from '@/lib/types'

function formatRelativeTime (value: string): string {
  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  const seconds = Math.round((Date.now() - timestamp.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function toBadgeVariant (entityType: string): 'default' | 'success' | 'warning' | 'info' | 'muted' {
  const lowered = entityType.toLowerCase()

  if (lowered.includes('application')) return 'success'
  if (lowered.includes('company') || lowered.includes('account')) return 'warning'
  if (lowered.includes('internship') || lowered.includes('profile')) return 'info'

  return 'muted'
}

export function ActivityFeed ({ items }: { items: DashboardListItem[] }) {
  const [query, setQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  const entityOptions = useMemo(() => {
    return ['all', ...new Set(items.map((item) => item.subtitle.toLowerCase()))]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesEntity = entityFilter === 'all' || item.subtitle.toLowerCase() === entityFilter
      const searchTarget = `${item.title} ${item.subtitle} ${item.meta ?? ''}`.toLowerCase()
      const matchesQuery = query.trim().length === 0 || searchTarget.includes(query.trim().toLowerCase())
      return matchesEntity && matchesQuery
    })
  }, [entityFilter, items, query])

  const entityCount = new Set(items.map((item) => item.subtitle.toLowerCase())).size
  const latestActivity = items[0]

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-300" />
          Activity log
        </CardTitle>
        <CardDescription>Recent actions recorded across the portal.</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/10 bg-gradient-to-b from-slate-100/10 to-slate-100/0 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Entries</p>
            <p className="mt-2 text-2xl font-semibold text-white">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/10 bg-gradient-to-b from-slate-100/10 to-slate-100/0 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Entity types</p>
            <p className="mt-2 text-2xl font-semibold text-white">{entityCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/10 bg-gradient-to-b from-slate-100/10 to-slate-100/0 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest</p>
            <p className="mt-2 truncate text-sm font-semibold text-white">{latestActivity ? latestActivity.title : 'None'}</p>
            <p className="mt-1 text-xs text-slate-400">{latestActivity ? formatRelativeTime(latestActivity.status) : 'No recent activity'}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200/10 bg-slate-900/20 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, entity, or metadata" className="pl-10" />
          </div>

          <div className="flex flex-wrap gap-2">
            {entityOptions.map((option) => {
              const active = entityFilter === option
              const label = option === 'all' ? 'All entities' : option

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEntityFilter(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    active
                      ? 'border-sky-300/40 bg-sky-400/15 text-sky-100'
                      : 'border-slate-200/10 bg-slate-100/5 text-slate-300 hover:bg-slate-100/10'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="relative space-y-3 pl-6 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-px before:bg-gradient-to-b before:from-slate-400/40 before:via-slate-400/20 before:to-transparent">
            {filteredItems.map((item) => (
              <div key={item.id} className="relative rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4 transition hover:border-slate-200/20 hover:bg-slate-100/10">
                <span className="absolute -left-[1.15rem] top-5 h-2.5 w-2.5 rounded-full border border-sky-300/40 bg-sky-300/70 shadow-[0_0_0_4px_rgba(15,23,42,0.9)]" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                  </div>
                  <Badge variant="muted">{formatRelativeTime(item.status)}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={toBadgeVariant(item.subtitle)}>{item.subtitle}</Badge>
                  {item.meta ? <Badge variant="muted">{item.meta.length > 64 ? `${item.meta.slice(0, 64)}...` : item.meta}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No results match this filter. Try a different entity type or search term.</p>
        )}
      </CardContent>
    </Card>
  )
}
