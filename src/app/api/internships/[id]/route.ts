import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth/guards'
import { internshipUpdateSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSession()
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = internshipUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid internship update payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: internship } = await supabase.from('internships').select('id, company_id').eq('id', id).maybeSingle()

  if (!internship) {
    return NextResponse.json({ error: 'Internship not found' }, { status: 404 })
  }

  if (user.role !== 'admin') {
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()

    if (!company || company.id !== internship.company_id) {
      return NextResponse.json({ error: 'You cannot edit this internship' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('internships').update({
    ...parsed.data,
    skills_required: parsed.data.skills_required ?? undefined
  }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: user.id,
    action: 'update',
    entityType: 'internship',
    entityId: id,
    metadata: parsed.data
  })

  return NextResponse.json({ message: 'Internship updated' })
}

export async function DELETE (_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSession()
  const { id } = await context.params
  const supabase = getSupabaseAdminClient()
  const { data: internship } = await supabase.from('internships').select('id, company_id').eq('id', id).maybeSingle()

  if (!internship) {
    return NextResponse.json({ error: 'Internship not found' }, { status: 404 })
  }

  if (user.role !== 'admin') {
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()

    if (!company || company.id !== internship.company_id) {
      return NextResponse.json({ error: 'You cannot delete this internship' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('internships').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: user.id,
    action: 'delete',
    entityType: 'internship',
    entityId: id
  })

  return NextResponse.json({ message: 'Internship deleted' })
}