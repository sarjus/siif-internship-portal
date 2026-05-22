import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { companyProfileSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest) {
  const user = await requireRole(['company', 'admin'])
  const body = await request.json().catch(() => null)
  const parsed = companyProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid company profile payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()

  if (!company && user.role !== 'admin') {
    return NextResponse.json({ error: 'Company profile not found' }, { status: 404 })
  }

  if (company) {
    const { error } = await supabase.from('companies').update({
      company_name: parsed.data.company_name,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      logo: parsed.data.logo || null
    }).eq('id', company.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  await logActivity({
    actorUserId: user.id,
    action: 'update',
    entityType: 'company_profile',
    entityId: company?.id ?? null,
    metadata: parsed.data
  })

  return NextResponse.json({ message: 'Company profile updated' })
}