import Link from 'next/link'
import { AdminAccountPanel } from '@/components/dashboard/admin-account-panel'
import { ListPanel } from '@/components/dashboard/list-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company-wise applied student status</CardTitle>
          <CardDescription>Open a consolidated view of student application statuses grouped by company.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/applications/company-wise"
            className="inline-flex h-9 items-center justify-center rounded-full bg-aurora-500 px-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-aurora-600 hover:shadow-md"
          >
            View company-wise status
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ListPanel title="Recent applications" description="Monitor submissions across the platform." items={data.recent} />
        <AdminAccountPanel accounts={accounts} />
      </div>
    </section>
  )
}
