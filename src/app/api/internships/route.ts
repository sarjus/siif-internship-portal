import { NextResponse, type NextRequest } from 'next/server'
import { internshipSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth/guards'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function GET () {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.from('internships').select('id, company_id, title, description, duration, stipend, skills_required, deadline, location, internship_type, openings, created_at, companies(company_name)').order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ internships: data ?? [] })
}

export async function POST (request: NextRequest) {
  const user = await requireSession()

  if (user.role !== 'company' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Only company or admin users can create internships' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = internshipSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid internship payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  let companyId = typeof body?.company_id === 'string' && body.company_id ? body.company_id : null

  if (user.role === 'company') {
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()
    companyId = company?.id ?? companyId
  }

  if (!companyId) {
    return NextResponse.json({ error: 'A company id is required to create an internship' }, { status: 400 })
  }

  const { data, error } = await supabase.from('internships').insert({
    company_id: companyId,
    title: parsed.data.title,
    description: parsed.data.description,
    duration: parsed.data.duration,
    stipend: parsed.data.stipend,
    skills_required: parsed.data.skills_required,
    deadline: parsed.data.deadline,
    location: parsed.data.location,
    internship_type: parsed.data.internship_type,
    openings: parsed.data.openings
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: user.id,
    action: 'create',
    entityType: 'internship',
    entityId: data?.id ?? null,
    metadata: { title: parsed.data.title, company_id: companyId }
  })

  return NextResponse.json({ internship: data }, { status: 201 })
}
