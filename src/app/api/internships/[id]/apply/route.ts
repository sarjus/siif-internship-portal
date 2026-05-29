import { NextResponse, type NextRequest } from 'next/server'
import { applicationSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { isIncompleteStudentProfile, type StudentProfileCompletionFields } from '@/lib/student-profile'

export const runtime = 'nodejs'

export async function POST (request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['student'])
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = applicationSchema.safeParse({ ...(body ?? {}), internship_id: id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid application payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const profileResult = await supabase
    .from('student_profiles')
    .select('college_name, programme, study_year, current_cgpa, back_papers, department, skills')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  const profileWithPhone = {
    ...((profileResult.data ?? {}) as StudentProfileCompletionFields),
    phone: user.phone
  }

  if (isIncompleteStudentProfile(profileWithPhone)) {
    return NextResponse.json({
      error: 'Complete your profile before applying for internships.',
      redirectTo: '/student/profile'
    }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('internship_id', parsed.data.internship_id)
    .eq('student_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already applied for this internship' }, { status: 409 })
  }

  const { data, error } = await supabase.from('applications').insert({
    internship_id: parsed.data.internship_id,
    student_id: user.id,
    resume_url: parsed.data.resume_url || null,
    status: 'submitted'
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: data }, { status: 201 })
}
