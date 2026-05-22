import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyApprovalPanel } from '@/components/dashboard/company-approval-panel'
import { AdminAccountPanel } from '@/components/dashboard/admin-account-panel'
import { InternshipManager } from '@/components/dashboard/internship-manager'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getAdminDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

type CompanyResultRow = {
  id: string
  company_name: string
  approved_status: boolean
  website: string | null
  users?: Array<{ email?: string | null }> | { email?: string | null } | null
}

export default async function AdminDashboardPage () {
  await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()
  const [data, accountsResult, companiesResult] = await Promise.all([
    getAdminDashboardData(),
    supabase.from('users').select('id, full_name, email, role, account_status').in('role', ['company', 'student']).order('created_at', { ascending: false }).limit(8),
    supabase.from('companies').select('id, company_name, approved_status, website, users(email)').order('approved_status', { ascending: true }).limit(8)
  ])

  const accounts = (accountsResult.data ?? []).map((account) => ({
    id: account.id,
    full_name: account.full_name,
    email: account.email,
    role: account.role,
    account_status: account.account_status
  }))

  const companies = (companiesResult.data ?? [] as CompanyResultRow[]).map((company) => {
    const companyUser = Array.isArray(company.users) ? company.users[0] ?? null : company.users ?? null

    return {
      id: company.id,
      company_name: company.company_name,
      email: companyUser?.email ?? 'Unknown',
      approved_status: company.approved_status,
      website: company.website
    }
  })

  return (
    <div id="overview" className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section id="companies" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CompanyApprovalPanel companies={companies} />
        <Card>
          <CardHeader>
            <CardTitle>Admin controls</CardTitle>
            <CardDescription>Manage incubator ecosystem operations and announcements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Create and manage company accounts',
              'Approve company registrations',
              'Create internship opportunities',
              'Assign internships to incubated companies',
              'Monitor applications and analytics'
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">
                <span className="text-sm text-slate-200">{item}</span>
                <Badge variant="info">Enabled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="applications" className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ListPanel title="Recent applications" description="Monitor submissions across the platform." items={data.recent} />
        <AdminAccountPanel accounts={accounts} />
      </section>

      <section id="approvals" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Approval queue</CardTitle>
            <CardDescription>Company onboarding and account status operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">Use the approval routes to enable or suspend accounts once connected to the UI actions.</p>
          </CardContent>
        </Card>
        <InternshipManager adminMode />
      </section>

      <section id="notifications" className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <NotificationCenter items={data.insights} />
        <Card>
          <CardHeader>
            <CardTitle>Analytics summary</CardTitle>
            <CardDescription>Platform activity across approvals and application flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                  </div>
                  <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm font-semibold text-sky-200">{item.status}</div>
                </div>
                {item.meta ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{item.meta}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="activity" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ActivityFeed items={data.activities} />
        <Card>
          <CardHeader>
            <CardTitle>Operational notes</CardTitle>
            <CardDescription>Admin actions are logged automatically for auditability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {[
              'Company approval changes are recorded',
              'Account status updates are tracked',
              'Announcements and internship edits are auditable',
              'Login and logout events are captured'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
