import { NextResponse, type NextRequest } from 'next/server'
import { authLoginSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { verifyPassword } from '@/lib/auth/password'
import { createSessionRecord, sessionCookieName } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/guards'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function POST (request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = authLoginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid login payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password_hash, role, phone, profile_image, account_status, created_at')
    .eq('email', parsed.data.email.toLowerCase())
    .maybeSingle()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const passwordMatches = await verifyPassword(parsed.data.password, user.password_hash)

  if (!passwordMatches) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (user.account_status !== 'active' && user.role !== 'admin') {
    return NextResponse.json({ error: 'This account is not active yet' }, { status: 403 })
  }

  const session = await createSessionRecord(user.id)
  const response = NextResponse.json({
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      account_status: user.account_status
    },
    redirectTo: getDashboardPath(user.role)
  })

  response.cookies.set(sessionCookieName(), session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(session.expiresAt),
    path: '/'
  })

  await logActivity({
    actorUserId: user.id,
    action: 'login',
    entityType: 'session',
    entityId: user.id,
    metadata: { role: user.role }
  })

  return response
}
