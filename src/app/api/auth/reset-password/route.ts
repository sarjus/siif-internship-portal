import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { isBefore } from 'date-fns'
import { resetPasswordSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth/password'
import { revokeSessionsForUser } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET (request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const supabase = getSupabaseAdminClient()

  const { data: resetRequest, error } = await supabase
    .from('password_resets')
    .select('id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error || !resetRequest || resetRequest.consumed_at || isBefore(new Date(resetRequest.expires_at), new Date())) {
    return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 })
  }

  return NextResponse.json({ message: 'Reset token is valid' })
}

export async function POST (request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = resetPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid reset payload' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  const supabase = getSupabaseAdminClient()

  const { data: resetRequest, error: resetError } = await supabase
    .from('password_resets')
    .select('id, user_id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (resetError || !resetRequest) {
    return NextResponse.json({ error: 'Reset link is invalid or has already been used' }, { status: 400 })
  }

  if (resetRequest.consumed_at || isBefore(new Date(resetRequest.expires_at), new Date())) {
    return NextResponse.json({ error: 'Reset link is invalid or has already been used' }, { status: 400 })
  }

  const passwordHash = await hashPassword(parsed.data.password)

  const [{ error: userError }, { error: consumedError }] = await Promise.all([
    supabase.from('users').update({ password_hash: passwordHash }).eq('id', resetRequest.user_id),
    supabase.from('password_resets').update({ consumed_at: new Date().toISOString() }).eq('id', resetRequest.id)
  ])

  if (userError || consumedError) {
    return NextResponse.json({ error: userError?.message ?? consumedError?.message ?? 'Unable to reset password' }, { status: 500 })
  }

  await revokeSessionsForUser(resetRequest.user_id)

  return NextResponse.json({ message: 'Password updated successfully. Please sign in again.' })
}