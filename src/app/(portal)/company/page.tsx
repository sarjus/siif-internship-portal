import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyProfileForm } from '@/components/dashboard/company-profile-form'
import { InternshipManager } from '@/components/dashboard/internship-manager'
import { ApplicationReviewBoard } from '@/components/dashboard/application-review-board'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { getCompanyNotifications } from '@/lib/dashboard'
import { getCompanyDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type CompanyApplicationRow = {
  id: string
  status: string
  applied_date: string | null
  student_id: string
  internship_id: string
  internships?: Array<{ title?: string | null; company_id?: string | null }> | { title?: string | null; company_id?: string | null } | null
}

export default async function CompanyDashboardPage () {
  const user = await requireRole(['company', 'admin'])
  const supabase = getSupabaseAdminClient()
  const [data, companyResult, applicationsResult] = await Promise.all([
    getCompanyDashboardData(user),
    supabase.from('companies').select('id, company_name, description, website, logo').eq('user_id', user.id).maybeSingle(),
    supabase.from('applications').select('id, status, applied_date, student_id, internship_id, internships(title, company_id)').order('applied_date', { ascending: false }).limit(8)
  ])
  const notifications = await getCompanyNotifications(user)

  const company = companyResult.data ?? { id: '', company_name: user.company_name ?? user.full_name, description: '', website: '', logo: '' }
  const applications = (applicationsResult.data ?? [] as CompanyApplicationRow[]).map((application) => {
    const internshipRow = Array.isArray(application.internships) ? application.internships[0] ?? null : application.internships ?? null

    return {
      id: application.id,
      title: internshipRow?.title ?? 'Application',
      subtitle: `Student ${application.student_id}`,
      status: application.status,
      meta: application.applied_date
    }
  })

  return (
    <div id="overview" className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section id="profile" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <CompanyProfileForm
          companyId={company.id}
          initialValues={{
            company_name: company.company_name ?? user.company_name ?? user.full_name,
            description: company.description ?? '',
            website: company.website ?? '',
            logo: company.logo ?? ''
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Company quick actions</CardTitle>
            <CardDescription>Shortcuts for the most common startup tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {[
              'Create and edit internships from the manager below',
              'Upload company logos into the logos bucket',
              'Review candidates and move them through the pipeline',
              'Schedule interviews and send updates'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
      </section>

      <section id="internships">
        <InternshipManager companyId={company.id} />
      </section>

      <section id="applications" className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ApplicationReviewBoard items={applications} />
        <ListPanel title="Applications queue" description="Recent submissions and review markers." items={data.recent} />
      </section>

      <section id="notifications">
        <ListPanel title="Company notifications" description="Recent updates for your startup account." items={notifications} />
      </section>

      <section id="activity" className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ActivityFeed items={data.activities} />
        <Card>
          <CardHeader>
            <CardTitle>Activity scope</CardTitle>
            <CardDescription>Only actions performed by your company account are shown here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {[
              'Internship edits and publishes are logged',
              'Application status changes are tracked',
              'Profile and logo updates are recorded',
              'Notifications and announcements remain auditable'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
