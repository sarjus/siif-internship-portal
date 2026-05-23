import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ArrowUpRight, BellRing, BriefcaseBusiness, CalendarClock, FileStack, MapPin, UserRoundCheck, Wallet } from 'lucide-react'

type InternshipRow = {
  id: string
  title: string | null
  location: string | null
  stipend: string | null
  duration: string | null
  internship_type: string | null
  companies?: Array<{ company_name?: string | null }> | { company_name?: string | null } | null
}

type DashboardInternshipCard = {
  id: string
  title: string
  company: string
  location: string
  stipend: string
  duration: string
  internshipType: string
}

const overviewActions = [
  {
    title: 'Complete profile details',
    subtitle: 'Keep your resume, skills, and links updated for better matches.',
    href: '/student/profile',
    Icon: UserRoundCheck
  },
  {
    title: 'Browse and apply internships',
    subtitle: 'Explore fresh openings and submit applications quickly.',
    href: '/student/browse',
    Icon: BriefcaseBusiness
  },
  {
    title: 'Track submitted applications',
    subtitle: 'See your current status and recent updates in one place.',
    href: '/student/applications',
    Icon: FileStack
  },
  {
    title: 'Check latest alerts',
    subtitle: 'Review notifications for actions and opportunities.',
    href: '/student/notifications',
    Icon: BellRing
  }
] as const

export default async function StudentOverviewPage () {
  const user = await requireRole(['student'])
  const data = await getStudentDashboardData(user)
  const supabase = getSupabaseAdminClient()

  let internshipsLoadError = false
  let internshipCards: DashboardInternshipCard[] = []

  try {
    const { data: internshipRows } = await supabase
      .from('internships')
      .select('id, title, location, stipend, duration, internship_type, companies(company_name)')
      .order('created_at', { ascending: false })
      .limit(4)

    internshipCards = (internshipRows ?? []).map((row) => {
      const internship = row as InternshipRow
      const companyRow = Array.isArray(internship.companies)
        ? internship.companies[0] ?? null
        : internship.companies ?? null

      return {
        id: internship.id,
        title: internship.title ?? 'Internship role',
        company: companyRow?.company_name ?? 'Incubated company',
        location: internship.location ?? 'Location not specified',
        stipend: internship.stipend ?? 'Stipend not specified',
        duration: internship.duration ?? 'Duration not specified',
        internshipType: internship.internship_type ?? 'full_time'
      }
    })
  } catch {
    internshipsLoadError = true
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="relative overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50/70 shadow-lg shadow-slate-200/50">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-2xl" />
          <CardHeader className="relative">
            <CardTitle>Overview</CardTitle>
            <CardDescription>Use the side menu to manage your profile, browse internships, and track applications.</CardDescription>
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
                <CardTitle>Application status</CardTitle>
                <CardDescription>Track every submission from your dashboard.</CardDescription>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {data.highlights.length} active
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {data.highlights.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500">
                No records yet. This section will populate once Supabase data is connected.
              </div>
            ) : data.highlights.map((item) => (
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
                {item.meta ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{item.meta}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Available internships</CardTitle>
            <CardDescription>Fresh roles from incubated companies. Open one to see full details and apply.</CardDescription>
          </CardHeader>
          <CardContent>
            {internshipCards.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {internshipCards.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                    <p className="mt-1 min-h-[48px] text-sm text-slate-600">{item.company}</p>

                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{item.location}</p>
                        <p className="flex items-center gap-2"><Wallet className="h-4 w-4 text-slate-400" />{item.stipend}</p>
                      </div>
                      <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-slate-400" />{item.duration}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">{item.internshipType.replace('_', ' ')}</span>
                      <Link href={`/student/browse?internship=${encodeURIComponent(item.id)}`} className="text-sm font-semibold text-aurora-600 hover:text-aurora-700">
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-semibold text-slate-900">No internships are available right now.</p>
                <p className="mt-2 text-sm text-slate-600">
                  {internshipsLoadError
                    ? 'We are unable to load internship listings at the moment. Please try again shortly.'
                    : 'New opportunities will appear here as soon as companies publish them.'}
                </p>
                <div className="mt-5">
                  <Link href="/student/browse" className="text-sm font-semibold text-aurora-600 hover:text-aurora-700">
                    Open browse page
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
