import { randomBytes, createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { addDays, isBefore } from 'date-fns'
import { cache } from 'react'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SessionUser } from '@/lib/types'

const DEFAULT_COOKIE_NAME = 'siif_portal_session'

function getCookieName (): string {
  return process.env.SESSION_COOKIE_NAME ?? DEFAULT_COOKIE_NAME
}

function sha256 (value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sessionDays (): number {
  const parsed = Number(process.env.SESSION_TTL_DAYS ?? '14')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14
}

export function createSessionToken (): string {
  return randomBytes(32).toString('hex')
}

export function hashSessionToken (token: string): string {
  return sha256(token)
}

export async function createSessionRecord (userId: string): Promise<{ token: string; expiresAt: string }> {
  const supabase = getSupabaseAdminClient()
  const token = createSessionToken()
  const expiresAt = addDays(new Date(), sessionDays()).toISOString()

  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt,
    revoked_at: null,
    last_seen_at: new Date().toISOString()
  })

  if (error) {
    throw new Error(error.message)
  }

  return { token, expiresAt }
}

export async function revokeSessionByToken (token: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  await supabase.from('sessions').delete().eq('token_hash', hashSessionToken(token))
}

async function revokeSessionById (sessionId: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  await supabase.from('sessions').delete().eq('id', sessionId)
}

export async function revokeSessionsForUser (userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  await supabase.from('sessions').delete().eq('user_id', userId)
}

export async function revokeCurrentSession (): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value

  if (!token) return
  await revokeSessionByToken(token)
  cookieStore.delete(getCookieName())
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value

  if (!token) return null

  const supabase = getSupabaseAdminClient()
  const tokenHash = hashSessionToken(token)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (sessionError || !session) return null
  if (session.revoked_at) return null
  if (isBefore(new Date(session.expires_at), new Date())) return null

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email, role, phone, profile_image, account_status, created_at')
    .eq('id', session.user_id)
    .maybeSingle()

  if (userError || !user) return null

  if (user.account_status !== 'active' && user.role !== 'admin') {
    await revokeSessionById(session.id)
    return null
  }

  await supabase.from('sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.id)

  if (user.role === 'company') {
    const { data: company } = await supabase
      .from('companies')
      .select('company_name')
      .eq('user_id', user.id)
      .maybeSingle()

    return {
      ...user,
      company_name: company?.company_name ?? null
    }
  }

  if (user.role === 'student') {
    const { data: student } = await supabase
      .from('student_profiles')
      .select('college_name, programme, study_year, current_cgpa, back_papers, department')
      .eq('user_id', user.id)
      .maybeSingle()

    return {
      ...user,
      college_name: student?.college_name ?? null,
      programme: student?.programme ?? null,
      study_year: student?.study_year ?? null,
      current_cgpa: student?.current_cgpa ?? null,
      back_papers: student?.back_papers ?? null,
      department: student?.department ?? null
    }
  }

  return user
})

export function sessionCookieName (): string {
  return getCookieName()
}
