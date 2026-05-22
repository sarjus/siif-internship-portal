import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import type { SessionUser, UserRole } from '@/lib/types'

export async function requireSession (): Promise<SessionUser> {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole (roles: UserRole[]): Promise<SessionUser> {
  const user = await requireSession()

  if (!roles.includes(user.role)) {
    redirect(getDashboardPath(user.role))
  }

  return user
}

export function getDashboardPath (role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'company') return '/company'
  return '/student'
}
