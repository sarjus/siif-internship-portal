import { ListPanel } from '@/components/dashboard/list-panel'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentApplicationsPage () {
  const user = await requireRole(['student'])
  const data = await getStudentDashboardData(user)

  return <ListPanel title="Application status" description="Track every submission from your dashboard." items={data.highlights} />
}
