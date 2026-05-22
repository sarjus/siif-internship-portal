import { NextResponse, type NextRequest } from 'next/server'
import { companyApprovalSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest, context: { params: Promise<{ companyId: string }> }) {
  const admin = await requireRole(['admin'])
  const { companyId } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = companyApprovalSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid approval payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: company, error: companyLookupError } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', companyId)
    .maybeSingle()

  if (companyLookupError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const { error: companyError } = await supabase.from('companies').update({ approved_status: parsed.data.approved_status }).eq('id', company.id)

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 })
  }

  const { error: userError } = await supabase.from('users').update({ account_status: parsed.data.approved_status ? 'active' : 'pending_approval' }).eq('id', company.user_id)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: admin.id,
    action: 'update',
    entityType: 'company',
    entityId: company.id,
    metadata: { approved_status: parsed.data.approved_status }
  })

  return NextResponse.json({ message: 'Company approval status updated' })
}
