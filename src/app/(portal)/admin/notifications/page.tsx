import Link from 'next/link'
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Need the incomplete-profile list?</p>
            <p className="mt-1 text-sm text-amber-800">Open student registrations with the incomplete profile filter already applied.</p>
            <div className="mt-3">
              <Link
                href="/admin/students?completion=incomplete"
                className="inline-flex h-9 items-center justify-center rounded-full bg-aurora-500 px-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-aurora-600 hover:shadow-md"
              >
                View incomplete profiles
              </Link>
            </div>
          </div>
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
