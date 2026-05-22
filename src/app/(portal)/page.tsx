import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/guards'

export default async function PortalHomePage () {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  redirect(getDashboardPath(user.role))
}
