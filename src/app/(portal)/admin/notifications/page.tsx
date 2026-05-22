import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { getAdminDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function AdminNotificationsPage () {
  await requireRole(['admin'])
  const data = await getAdminDashboardData()

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <NotificationCenter items={data.insights} />
      <Card>
        <CardHeader>
          <CardTitle>Analytics summary</CardTitle>
          <CardDescription>Platform activity across approvals and application flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.insights.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
              {item.meta ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{item.meta}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
