import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { requireSession } from '@/lib/auth/guards'

export default async function PortalLayout ({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireSession()

  if (!user) {
    redirect('/login')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
