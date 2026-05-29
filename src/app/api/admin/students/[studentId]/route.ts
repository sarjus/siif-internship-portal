import { NextResponse, type NextRequest } from 'next/server'
import { adminStudentUpdateSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { logActivity } from '@/lib/activity'
import { revokeSessionsForUser } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
  const admin = await requireRole(['admin'])
  const { studentId } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = adminStudentUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid student update payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: studentUser, error: studentLookupError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', studentId)
    .maybeSingle()

  if (studentLookupError || !studentUser || studentUser.role !== 'student') {
    return NextResponse.json({ error: 'Student account not found' }, { status: 404 })
  }

  const normalizedEmail = parsed.data.email.toLowerCase()
  const { data: existingEmailUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .neq('id', studentId)
    .maybeSingle()

  if (existingEmailUser) {
    return NextResponse.json({ error: 'Another account with this email already exists' }, { status: 409 })
  }

  const { error: userError } = await supabase.from('users').update({
    full_name: parsed.data.full_name,
    email: normalizedEmail,
    phone: parsed.data.phone || null,
    account_status: parsed.data.account_status
  }).eq('id', studentId)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const { error: profileError } = await supabase.from('student_profiles').upsert({
    user_id: studentId,
    college_name: parsed.data.college_name || null,
    programme: parsed.data.programme || null,
    study_year: parsed.data.study_year || null,
    current_cgpa: parsed.data.current_cgpa || null,
    back_papers: parsed.data.back_papers,
    department: parsed.data.department || null,
    skills: parsed.data.skills,
    resume_url: parsed.data.resume_url || null,
    github: parsed.data.github || null,
    linkedin: parsed.data.linkedin || null,
    portfolio: parsed.data.portfolio || null
  }, { onConflict: 'user_id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await revokeSessionsForUser(studentId)

  await logActivity({
    actorUserId: admin.id,
    action: 'update',
    entityType: 'student_registration',
    entityId: studentId,
    metadata: {
      account_status: parsed.data.account_status,
      email: normalizedEmail
    }
  })

  return NextResponse.json({ message: 'Student registration updated' })
}

export async function DELETE (_request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
  const admin = await requireRole(['admin'])
  const { studentId } = await context.params
  const supabase = getSupabaseAdminClient()

  const { data: studentUser, error: studentLookupError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', studentId)
    .maybeSingle()

  if (studentLookupError || !studentUser || studentUser.role !== 'student') {
    return NextResponse.json({ error: 'Student account not found' }, { status: 404 })
  }

  const { error: applicationsError } = await supabase.from('applications').delete().eq('student_id', studentId)
  if (applicationsError) {
    return NextResponse.json({ error: applicationsError.message }, { status: 500 })
  }

  const { error: notificationsError } = await supabase.from('notifications').delete().eq('user_id', studentId)
  if (notificationsError) {
    return NextResponse.json({ error: notificationsError.message }, { status: 500 })
  }

  const { error: profileError } = await supabase.from('student_profiles').delete().eq('user_id', studentId)
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await revokeSessionsForUser(studentId)

  const { error: userDeleteError } = await supabase.from('users').delete().eq('id', studentId).eq('role', 'student')
  if (userDeleteError) {
    return NextResponse.json({ error: userDeleteError.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: admin.id,
    action: 'delete',
    entityType: 'student_registration',
    entityId: studentId,
    metadata: { removed: true }
  })

  return NextResponse.json({ message: 'Student registration deleted' })
}
