import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListPanel } from '@/components/dashboard/list-panel'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getCompanyDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'
import Link from 'next/link'
import { Activity, ArrowUpRight, BellRing, BriefcaseBusiness, FileSearch, Building2 } from 'lucide-react'

const overviewActions = [
  {
    title: 'Update organisation details',
    subtitle: 'Maintain company profile, contacts, and links.',
    href: '/company/profile',
    Icon: Building2
  },
  {
    title: 'Create and edit openings',
    subtitle: 'Publish new internships and manage saved postings.',
    href: '/company/internships',
    Icon: BriefcaseBusiness
  },
  {
    title: 'Review candidate pipeline',
    subtitle: 'Shortlist and move applications through status updates.',
    href: '/company/applications',
    Icon: FileSearch
  },
  {
    title: 'Track updates and alerts',
    subtitle: 'Monitor notifications and account activity timeline.',
    href: '/company/notifications',
    Icon: BellRing
  }
] as const

export default async function CompanyOverviewPage () {
  const user = await requireRole(['company', 'admin'])
  const data = await getCompanyDashboardData(user)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section>
        <ListPanel title="Saved internships" description="Recently saved openings from your company." items={data.highlights} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="relative overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50/70 shadow-lg shadow-slate-200/50">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-2xl" />
          <CardHeader className="relative">
            <CardTitle>Overview</CardTitle>
            <CardDescription>Use the side menu to manage company profile, internships, and candidate reviews.</CardDescription>
          </CardHeader>
          <CardContent className="relative grid gap-3 text-sm text-slate-600">
            {overviewActions.map(({ title, subtitle, href, Icon }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-xl bg-sky-100 p-2 text-sky-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-sky-700" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/60 shadow-lg shadow-slate-200/50">
          <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-2xl" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recent applications</CardTitle>
                <CardDescription>Latest candidates across your posted internships.</CardDescription>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {data.recent.length} entries
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {data.recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500">
                No records yet. This section will populate once Supabase data is connected.
              </div>
            ) : data.recent.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    {item.status}
                  </span>
                </div>
                {item.meta ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-slate-500">
                    <Activity className="h-3.5 w-3.5" />
                    {item.meta}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
