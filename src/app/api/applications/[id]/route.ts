import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { applicationUpdateSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'
import { getAppBaseUrl, sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'company'])
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = applicationUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid application update payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: application } = await supabase
    .from('applications')
    .select('id, internship_id, student_id, internships(company_id)')
    .eq('id', id)
    .maybeSingle()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  if (user.role === 'company') {
    const internshipRow = Array.isArray(application.internships) ? application.internships[0] : application.internships
    const companyId = internshipRow?.company_id
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()

    if (!company || company.id !== companyId) {
      return NextResponse.json({ error: 'You cannot update this application' }, { status: 403 })
    }
  }

  const internshipRow = Array.isArray(application.internships) ? application.internships[0] : application.internships
  const companyId = internshipRow?.company_id ?? null

  const { error } = await supabase.from('applications').update({ status: parsed.data.status }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const [{ data: internship }, { data: student }, { data: company }] = await Promise.all([
    supabase.from('internships').select('id, title, company_id').eq('id', application.internship_id).maybeSingle(),
    supabase.from('users').select('id, full_name, email').eq('id', application.student_id).maybeSingle(),
    companyId ? supabase.from('companies').select('id, company_name, user_id').eq('id', companyId).maybeSingle() : Promise.resolve({ data: null })
  ])

  const { data: companyUser } = company?.user_id
    ? await supabase.from('users').select('id, full_name, email').eq('id', company.user_id).maybeSingle()
    : { data: null }

  const statusLabel = parsed.data.status.replace(/_/g, ' ')
  const applicationLink = `${getAppBaseUrl(request.nextUrl.origin)}/company/applications`

  await Promise.allSettled([
    student?.email ? sendEmail({
      to: student.email,
      subject: `Your application status changed to ${statusLabel}`,
      text: `Hi ${student.full_name ?? 'there'},\n\nYour application for ${internship?.title ?? 'an internship'} is now ${statusLabel}.\n\nView your application dashboard: ${applicationLink}`,
      html: `<p>Hi ${student.full_name ?? 'there'},</p><p>Your application for <strong>${internship?.title ?? 'an internship'}</strong> is now <strong>${statusLabel}</strong>.</p><p><a href="${applicationLink}">View application dashboard</a></p>`
    }) : Promise.resolve(false),
    companyUser?.email ? sendEmail({
      to: companyUser.email,
      subject: `Application status updated: ${statusLabel}`,
      text: `The application for ${internship?.title ?? 'an internship'} has been updated to ${statusLabel}.`,
      html: `<p>The application for <strong>${internship?.title ?? 'an internship'}</strong> has been updated to <strong>${statusLabel}</strong>.</p>`
    }) : Promise.resolve(false)
  ])

  await logActivity({
    actorUserId: user.id,
    action: 'update',
    entityType: 'application',
    entityId: id,
    metadata: { status: parsed.data.status }
  })

  return NextResponse.json({ message: 'Application updated' })
}