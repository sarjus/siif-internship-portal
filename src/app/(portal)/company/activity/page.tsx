import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCompanyDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function CompanyActivityPage () {
  const user = await requireRole(['company', 'admin'])
  const data = await getCompanyDashboardData(user)

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <ActivityFeed items={data.activities} />
      <Card>
        <CardHeader>
          <CardTitle>Activity scope</CardTitle>
          <CardDescription>Only actions performed by your company account are shown here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            'Internship edits and publishes are logged',
            'Application status changes are tracked',
            'Profile and logo updates are recorded',
            'Notifications and announcements remain auditable'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
        </CardContent>
      </Card>
    </section>
  )
}
