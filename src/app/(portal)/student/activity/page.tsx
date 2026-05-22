import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentActivityPage () {
  const user = await requireRole(['student'])
  const data = await getStudentDashboardData(user)

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <ActivityFeed items={data.activities} />
      <Card>
        <CardHeader>
          <CardTitle>Activity scope</CardTitle>
          <CardDescription>Your own application and profile actions are listed here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            'Submitted applications appear here',
            'Profile and resume changes are captured',
            'Login and session events remain auditable',
            'Notifications can be cross-checked against activity history'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
        </CardContent>
      </Card>
    </section>
  )
}
