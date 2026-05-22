import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarClock, ChevronRight, MapPin, Wallet } from 'lucide-react'
import { BrandMark } from '@/components/layout/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSessionUser } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const roleCards = [
  {
    title: 'Where startups meet student talent',
    description: 'Bridge the gap between emerging startups and skilled students through streamlined applications, collaboration, and hiring workflows.'
  },
  {
    title: 'One platform for internships and innovation',
    description: 'Manage opportunities, applications, approvals, and onboarding from a single ecosystem designed for startup-driven growth.'
  },
  {
    title: 'Building careers through startup ecosystems',
    description: 'Empowering students with hands-on industry exposure while helping startups discover passionate young talent.'
  }
]

type InternshipOffering = {
  id: string
  title: string
  company: string
  location: string
  stipend: string
  duration: string
  internshipType: string
}

type InternshipRow = {
  id: string | null
  title: string | null
  location: string | null
  stipend: string | null
  duration: string | null
  internship_type: string | null
  companies?: Array<{ company_name?: string | null }> | { company_name?: string | null } | null
}

const fallbackInternshipOfferings: InternshipOffering[] = [
  {
    id: 'offering-1',
    title: 'Accounts',
    company: 'Zebronics India Private Limited',
    location: 'Chennai',
    stipend: 'Rs 12,000 - 18,000 /month',
    duration: '6 Months',
    internshipType: 'full_time'
  },
  {
    id: 'offering-2',
    title: 'Content Programming',
    company: 'Hungama Digital Media Entertainment Private Limited',
    location: 'Mumbai',
    stipend: 'Rs 5,000 /month',
    duration: '3 Months',
    internshipType: 'part_time'
  },
  {
    id: 'offering-3',
    title: 'Human Resources (HR)',
    company: 'Motilal Oswal Financial Services Limited',
    location: 'Thane',
    stipend: 'Rs 5,000 - 8,000 /month',
    duration: '6 Months',
    internshipType: 'full_time'
  },
  {
    id: 'offering-4',
    title: 'HR Coordinator/Talent Acquisition',
    company: 'Turner & Townsend',
    location: 'Ahmedabad, Mumbai',
    stipend: 'Rs 5,000 - 10,000 /month',
    duration: '2 Months',
    internshipType: 'remote'
  }
]

export default async function HomePage () {
  const user = await getSessionUser()
  const supabase = getSupabaseAdminClient()

  let internshipOfferings: InternshipOffering[] = fallbackInternshipOfferings

  try {
    const { data } = await supabase
      .from('internships')
      .select('id, title, location, stipend, duration, internship_type, companies(company_name)')
      .order('created_at', { ascending: false })
      .limit(8)

    if (Array.isArray(data) && data.length > 0) {
      internshipOfferings = (data as InternshipRow[]).map((row) => {
        const companyRow = Array.isArray(row.companies) ? row.companies[0] ?? null : row.companies ?? null

        return {
          id: String(row.id),
          title: row.title ?? 'Internship role',
          company: companyRow?.company_name ?? 'Incubated company',
          location: row.location ?? 'Location not specified',
          stipend: row.stipend ?? 'Stipend not specified',
          duration: row.duration ?? 'Duration not specified',
          internshipType: row.internship_type ?? 'full_time'
        }
      })
    }
  } catch {
    internshipOfferings = fallbackInternshipOfferings
  }

  const internshipFilters = [
    'All',
    ...Array.from(new Set(internshipOfferings.map((item) => item.internshipType.replace('_', ' '))))
  ]

  return (
    <div className="noise">
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center justify-end gap-3">
            <Link href={user ? getDashboardPath(user.role) : '/login'}>
              <Button variant="outline" size="sm">{user ? 'Open dashboard' : 'Login'}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-r from-aurora-600 to-aurora-500">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-white/10" />
          <div className="absolute right-[-180px] top-[110px] h-[520px] w-[520px] rounded-full bg-white/10" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
            <div className="relative z-10 flex flex-col justify-center">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                SIIF&apos;s <span className="text-amber-300">internship platform</span>
              </h1>
              <p className="mt-4 max-w-2xl text-2xl text-white/90 sm:text-3xl">
                For startup hiring, internships, and incubator programs.
              </p>
            </div>

            <div className="relative z-10 flex items-end justify-center">
              <div className="relative h-[400px] w-full max-w-[760px] lg:h-[500px]">
                <Image
                  src="/Front Page.png"
                  alt="Students and startup candidates"
                  fill
                  priority
                  className="object-contain object-bottom scale-110 lg:scale-125"
                  sizes="(min-width: 1024px) 38vw, 90vw"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[2rem] border border-rose-200/70 bg-rose-50/80 p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Internship Offerings</h2>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              {internshipFilters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={index === 0
                    ? 'rounded-full border border-aurora-600 bg-aurora-500 px-5 py-2 text-sm font-semibold text-white shadow-sm'
                    : 'rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm'}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {internshipOfferings.slice(0, 4).map((item) => (
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
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">Internship</span>
                    <Link href="/register" className="inline-flex items-center gap-1 text-sm font-semibold text-aurora-600 hover:text-aurora-700">
                      View details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">FUTURE-READY INTERNSHIPS</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Empowering innovation through industry-driven internship experiences.</h2>
            </div>
            
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {roleCards.map((card) => {
              return (
                <Card key={card.title} className="group hover:-translate-y-1 hover:shadow-glow">
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <Card className="overflow-hidden">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-lime-300">SMART ECOSYSTEM PLATFORM</p>
                <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Designed to simplify internship management from application to onboarding.</h2>
                <p className="mt-4 max-w-2xl text-slate-300">
                  INTERNx SIIF provides a centralized system for incubators, startups, and students to collaborate efficiently through secure workflows, structured approvals, and streamlined communication.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Secure Access', 'Protected login system with encrypted credentials and role-based permissions.'],
                  ['Centralized Management', 'Manage internships, applications, startups, and announcements from one dashboard.'],
                  ['Application Tracking', 'Monitor application progress, shortlist candidates, and manage hiring workflows seamlessly.'],
                  ['Role-Based Dashboards', 'UDedicated experiences for incubator admins, startups, and students.']
                ].map(([title, text]) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-sky-500/15 to-lime-400/10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-300">GET STARTED</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Launch your internship journey with INTERNx SIIF.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/register"><Button size="lg">Create account</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Login</Button></Link>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
          <div className="space-y-3">
            <p className="text-sm tracking-[0.28em] text-slate-500">INTERNx SIIF</p>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
              Connecting students, startups, and incubators through meaningful internship opportunities, application tracking, and seamless onboarding.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">QUICK LINKS</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="transition hover:text-aurora-700">Explore Internships</Link>
              <Link href="/register" className="transition hover:text-aurora-700">Apply Now</Link>
              <Link href="/login" className="transition hover:text-aurora-700">Login</Link>
              <Link href={user ? getDashboardPath(user.role) : '/login'} className="transition hover:text-aurora-700">Dashboard</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">PLATFORM</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Built for students, startups, and incubators to manage internships, applications, onboarding, and progress in one unified platform.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>Copyright @SIIF 2026</p>
            <p>
              Developed by Sarju S,
              {' '}
              <a href="https://techyprofessor.in/" target="_blank" rel="noreferrer" className="text-aurora-700 underline decoration-aurora-400/60 underline-offset-4 hover:text-aurora-800">
                https://techyprofessor.in/
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
