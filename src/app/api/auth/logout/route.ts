import { NextResponse } from 'next/server'
import { revokeCurrentSession, sessionCookieName } from '@/lib/auth/session'
import { getSessionUser } from '@/lib/auth/session'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function POST () {
  const user = await getSessionUser()
  await revokeCurrentSession()

  if (user) {
    await logActivity({
      actorUserId: user.id,
      action: 'logout',
      entityType: 'session',
      entityId: user.id,
      metadata: { role: user.role }
    })
  }

  const response = NextResponse.json({ message: 'Logged out successfully' })
  response.cookies.set(sessionCookieName(), '', { expires: new Date(0), path: '/' })
  return response
}
