import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardListItem } from '@/lib/types'

export function ListPanel ({ title, description, items }: { title: string; description?: string; items: DashboardListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No records yet. This section will populate once Supabase data is connected.</p>
        ) : items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
              </div>
              <Badge variant="muted">{item.status}</Badge>
            </div>
            {item.meta ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{item.meta}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
