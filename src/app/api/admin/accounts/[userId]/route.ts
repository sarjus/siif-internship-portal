import { NextResponse, type NextRequest } from 'next/server'
import { accountStatusSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH (request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole(['admin'])
  const { userId } = await context.params
  const body = await request.json().catch(() => null)
  const parsed = accountStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid account status payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from('users').update({ account_status: parsed.data.account_status }).eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: admin.id,
    action: 'update',
    entityType: 'user_account',
    entityId: userId,
    metadata: { account_status: parsed.data.account_status }
  })

  return NextResponse.json({ message: 'Account status updated' })
}
