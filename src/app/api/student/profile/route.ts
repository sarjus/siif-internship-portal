import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { studentProfileSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest) {
  const user = await requireRole(['student'])
  const body = await request.json().catch(() => null)
  const parsed = studentProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid student profile payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from('student_profiles').update({
    college_name: parsed.data.college_name,
    programme: parsed.data.programme,
    study_year: parsed.data.study_year,
    current_cgpa: parsed.data.current_cgpa,
    back_papers: parsed.data.back_papers,
    department: parsed.data.department,
    skills: parsed.data.skills,
    resume_url: parsed.data.resume_url || null,
    github: parsed.data.github || null,
    linkedin: parsed.data.linkedin || null,
    portfolio: parsed.data.portfolio || null
  }).eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (parsed.data.profile_image !== undefined) {
    await supabase.from('users').update({ profile_image: parsed.data.profile_image || null }).eq('id', user.id)
  }

  await logActivity({
    actorUserId: user.id,
    action: 'update',
    entityType: 'student_profile',
    entityId: user.id,
    metadata: parsed.data
  })

  return NextResponse.json({ message: 'Student profile updated' })
}