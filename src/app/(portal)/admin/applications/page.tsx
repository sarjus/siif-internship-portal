import { AdminAccountPanel } from '@/components/dashboard/admin-account-panel'
import { ListPanel } from '@/components/dashboard/list-panel'
import { getAdminDashboardData } from '@/lib/dashboard'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'

export default async function AdminApplicationsPage () {
  await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()
  const [data, accountsResult] = await Promise.all([
    getAdminDashboardData(),
    supabase.from('users').select('id, full_name, email, role, account_status').in('role', ['company', 'student']).order('created_at', { ascending: false }).limit(8)
  ])

  const accounts = (accountsResult.data ?? []).map((account) => ({
    id: account.id,
    full_name: account.full_name,
    email: account.email,
    role: account.role,
    account_status: account.account_status
  }))

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <ListPanel title="Recent applications" description="Monitor submissions across the platform." items={data.recent} />
      <AdminAccountPanel accounts={accounts} />
    </section>
  )
}
