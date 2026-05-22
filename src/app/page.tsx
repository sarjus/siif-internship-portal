import Link from 'next/link'
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChartColumn, Layers3, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/layout/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSessionUser } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/guards'

const roleCards = [
  {
    title: 'Incubator Admin',
    description: 'Manage company approvals, internships, applications, announcements, and analytics from one control room.',
    icon: ShieldCheck,
    href: '/login'
  },
  {
    title: 'Company / Startup',
    description: 'Create internships, review applicants, shortlist candidates, and coordinate interviews with the incubator.',
    icon: BriefcaseBusiness,
    href: '/register'
  },
  {
    title: 'Student',
    description: 'Build a profile, upload your resume, browse roles, apply quickly, and track every status update.',
    icon: Layers3,
    href: '/register'
  }
]

const features = [
  { title: 'Custom auth', description: 'Manual registration, bcrypt password hashing, and secure session cookies without Supabase Auth.', icon: BadgeCheck },
  { title: 'Role-based portals', description: 'Separate workflows for admin, startup, and student users with protected dashboards.', icon: ShieldCheck },
  { title: 'Storage-ready uploads', description: 'Resumes, logos, profile photos, and brochures can be uploaded into Supabase Storage buckets.', icon: ChartColumn },
  { title: 'Modern interface', description: 'A polished incubator-inspired UI with responsive shells, cards, skeletons, and geometric motion.', icon: Sparkles }
]

export default async function HomePage () {
  const user = await getSessionUser()

  return (
    <div className="noise">
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link href={user ? getDashboardPath(user.role) : '/login'}>
              <Button variant="outline">{user ? 'Open dashboard' : 'Login'}</Button>
            </Link>
            <Link href="/register">
              <Button>Get started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
                <Sparkles className="h-4 w-4" />
                Internship ecosystem for incubators
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Manage startups, students, and internships from one secure portal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Built on Supabase Postgres and Storage, with a fully custom authentication layer, role-based access, and dashboards for incubator admins, startups, and students.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register"><Button size="lg">Create account</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Sign in</Button></Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ['3 roles', 'Admin, company, student'],
                  ['Manual auth', 'bcrypt + session cookies'],
                  ['Supabase-ready', 'Database, API, storage']
                ].map(([title, text]) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <div className="relative h-[460px] w-full max-w-[520px]">
                <div className="hero-orbit absolute inset-[8%] rounded-[2.5rem] shadow-glow" />
                <div className="absolute left-[8%] top-[12%] h-28 w-28 rounded-[2rem] border border-sky-400/20 bg-sky-400/15 shadow-glow animate-float" />
                <div className="absolute right-[10%] top-[18%] h-20 w-20 rounded-[1.5rem] border border-lime-400/20 bg-lime-400/15 animate-float" style={{ animationDelay: '1.2s' }} />
                <div className="absolute left-[24%] bottom-[12%] h-24 w-24 rounded-[2rem] border border-white/10 bg-white/10 animate-float" style={{ animationDelay: '2s' }} />
                <Card className="absolute inset-x-[12%] top-[14%] rounded-[2rem] p-0">
                  <CardHeader className="border-b border-white/10 px-6 py-5">
                    <CardTitle>Portal overview</CardTitle>
                    <CardDescription>Analytics, approvals, and applications at a glance.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-6 py-6">
                    <div className="grid grid-cols-3 gap-3">
                      {['Users', 'Roles', 'Files'].map((label, index) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <p className="text-2xl font-bold text-white">{index === 0 ? '128' : index === 1 ? '3' : '12'}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-dashed border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100">
                      Custom auth flow, Supabase-backed data, and storage buckets for resumes, logos, and brochures.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Role portals</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Built around the incubator workflow</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-400">
              The layout keeps the template's dark geometric feel while turning it into a dashboard-first product experience.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {roleCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className="group hover:-translate-y-1 hover:shadow-glow">
                  <CardHeader>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 hover:text-sky-100">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-5 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
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
                <p className="text-sm uppercase tracking-[0.35em] text-lime-300">Production-ready stack</p>
                <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Supabase for data and storage. Custom code for identity.</h2>
                <p className="mt-4 max-w-2xl text-slate-300">
                  Sessions are stored in a database-backed custom session table, passwords are hashed with bcrypt, and role-based redirects happen after login. Use Supabase only where it makes sense: Postgres, APIs, storage, and optional realtime updates.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Secure sessions', 'Opaque cookie session tokens backed by the database'],
                  ['Approval flow', 'Incubator admins approve company accounts before access'],
                  ['Storage buckets', 'Resume, logo, profile image, and brochure uploads'],
                  ['Role redirects', 'Users land on the right dashboard after login']
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
                <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Start now</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Launch the portal with your Supabase keys.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/register"><Button size="lg">Create account</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Login</Button></Link>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}
