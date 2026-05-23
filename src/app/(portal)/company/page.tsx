import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getCompanyDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'
export default async function CompanyOverviewPage () {
  const user = await requireRole(['company', 'admin'])
  const data = await getCompanyDashboardData(user)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section>
        <ListPanel title="Saved internships" description="Recently saved openings from your company." items={data.highlights} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Use the side menu to manage company profile, internships, and candidate reviews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {[
              'Update organisation details from Profile page',
              'Create and edit openings in Internships page',
              'Review candidate pipeline in Applications page',
              'Track updates in Notifications and Activity pages'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
        <ListPanel title="Recent applications" description="Latest candidates across your posted internships." items={data.recent} />
      </section>
    </div>
  )
}
