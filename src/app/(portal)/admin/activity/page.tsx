import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function AdminActivityPage () {
  await requireRole(['admin'])
  const data = await getAdminDashboardData()

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <ActivityFeed items={data.activities} />
      <Card>
        <CardHeader>
          <CardTitle>Operational notes</CardTitle>
          <CardDescription>Admin actions are logged automatically for auditability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            'Company approval changes are recorded',
            'Account status updates are tracked',
            'Announcements and internship edits are auditable',
            'Login and logout events are captured'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
        </CardContent>
      </Card>
    </section>
  )
}
