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
          <p className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 px-4 py-6 text-sm text-slate-500">No records yet. This section will populate once Supabase data is connected.</p>
        ) : items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
              </div>
              <Badge variant="muted">{item.status}</Badge>
            </div>
            {item.meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{item.meta}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
