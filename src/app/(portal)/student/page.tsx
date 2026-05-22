import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentOverviewPage () {
  const user = await requireRole(['student'])
  const data = await getStudentDashboardData(user)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Use the side menu to manage your profile, browse internships, and track applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {[
              'Complete profile details in the Profile page',
              'Browse and apply internships from the Browse page',
              'Track submitted applications in Applications page',
              'Check latest alerts in Notifications page'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
        <ListPanel title="Application status" description="Track every submission from your dashboard." items={data.highlights} />
      </section>
    </div>
  )
}
