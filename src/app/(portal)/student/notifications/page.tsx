import { ListPanel } from '@/components/dashboard/list-panel'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentNotificationsPage () {
  const user = await requireRole(['student'])
  const data = await getStudentDashboardData(user)

  return <ListPanel title="Notifications" description="Updates from the incubator and application pipeline." items={data.notifications} />
}
