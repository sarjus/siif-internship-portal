import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { applicationUpdateSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'

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
    .select('id, internship_id, internships(company_id)')
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

  const { error } = await supabase.from('applications').update({ status: parsed.data.status }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: user.id,
    action: 'update',
    entityType: 'application',
    entityId: id,
    metadata: { status: parsed.data.status }
  })

  return NextResponse.json({ message: 'Application updated' })
}