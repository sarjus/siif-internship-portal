'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bell, BriefcaseBusiness, GraduationCap, LayoutDashboard, Menu, Settings2, ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser, UserRole } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/layout/logout-button'

type NavigationItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function getNavigationItems (role: UserRole): NavigationItem[] {
  if (role === 'admin') {
    return [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Companies', href: '/admin/companies', icon: BriefcaseBusiness },
      { label: 'Student Registrations', href: '/admin/students', icon: GraduationCap },
      { label: 'Applications', href: '/admin/applications', icon: Users },
      { label: 'Company-wise Status', href: '/admin/applications/company-wise', icon: BarChart3 },
      { label: 'Approvals', href: '/admin/approvals', icon: ShieldCheck },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Activity', href: '/admin/activity', icon: Settings2 }
    ]
  }

  if (role === 'company') {
    return [
      { label: 'Overview', href: '/company', icon: LayoutDashboard },
      { label: 'Profile', href: '/company/profile', icon: BriefcaseBusiness },
      { label: 'Internships', href: '/company/internships', icon: Users },
      { label: 'Applicants', href: '/company/applications', icon: ShieldCheck },
      { label: 'Notifications', href: '/company/notifications', icon: Bell },
      { label: 'Activity', href: '/company/activity', icon: Settings2 }
    ]
  }

  return [
    { label: 'Overview', href: '/student', icon: LayoutDashboard },
    { label: 'Profile', href: '/student/profile', icon: ShieldCheck },
    { label: 'Applications', href: '/student/applications', icon: Users },
    { label: 'Browse', href: '/student/browse', icon: BriefcaseBusiness },
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
    { label: 'Activity', href: '/student/activity', icon: Settings2 }
  ]
}

function roleLabel (role: UserRole): string {
  if (role === 'admin') return 'Incubator Admin'
  if (role === 'company') return 'Company / Startup'
  return 'Student'
}

export function DashboardShell ({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = useMemo(() => getNavigationItems(user.role), [user.role])

  return (
    <div className="min-h-screen bg-dashboard-grid text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={cn('fixed inset-y-0 left-0 z-40 w-[290px] transform border-r border-slate-200 bg-white/95 p-6 backdrop-blur-xl transition-transform lg:static lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between lg:block">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-600">INTERNx SIIF</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">Intership Portal</h1>
              </div>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileOpen(false)}>
                Close
              </Button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sm font-semibold text-sky-700">
                  {user.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user.full_name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={user.account_status === 'active' ? 'success' : 'warning'}>{roleLabel(user.role)}</Badge>
                <Badge variant="muted">{user.account_status.replace('_', ' ')}</Badge>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const ActiveIcon = item.icon
                const active = pathname === item.href.split('#')[0]
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-100', active ? 'bg-sky-100 text-sky-700' : 'text-slate-700')}
                    onClick={() => setMobileOpen(false)}
                  >
                    <ActiveIcon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Need a quick action?</p>
              <div className="flex gap-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {mobileOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mb-5 hidden items-center justify-end lg:flex">
            <LogoutButton />
          </div>

          <div className="mb-5 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-xl lg:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
              <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <LogoutButton />
              <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
                <Menu className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 sm:p-6 lg:p-8 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
