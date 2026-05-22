import { ListPanel } from '@/components/dashboard/list-panel'
import { getCompanyNotifications } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function CompanyNotificationsPage () {
  const user = await requireRole(['company', 'admin'])
  const notifications = await getCompanyNotifications(user)

  return <ListPanel title="Company notifications" description="Recent updates for your startup account." items={notifications} />
}
