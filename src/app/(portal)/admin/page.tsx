import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getAdminDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function AdminDashboardPage () {
  await requireRole(['admin'])
  const data = await getAdminDashboardData()

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Use the side menu to manage companies, applications, approvals, and notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Review company accounts in Companies page',
              'Track applications in Applications page',
              'Approve registrations in Approvals page',
              'Follow system alerts in Notifications and Activity pages'
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm text-slate-700">{item}</span>
                <Badge variant="info">Enabled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <ListPanel title="Recent applications" description="Monitor submissions across the platform." items={data.recent} />
      </section>
    </div>
  )
}
