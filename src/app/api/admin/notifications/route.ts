import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { notificationSchema } from '@/lib/validators'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function POST (request: NextRequest) {
  const admin = await requireRole(['admin'])
  const body = await request.json().catch(() => null)
  const parsed = notificationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid notification payload' }, { status: 400 })
  }

  if (parsed.data.target_roles.length === 0 && parsed.data.target_user_ids.length === 0) {
    return NextResponse.json({ error: 'Select at least one target role or user' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const recipientIds = new Set<string>(parsed.data.target_user_ids)

  if (parsed.data.target_roles.length > 0) {
    const { data: recipients, error } = await supabase
      .from('users')
      .select('id')
      .in('role', parsed.data.target_roles)
      .eq('account_status', 'active')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    for (const recipient of recipients ?? []) {
      recipientIds.add(recipient.id)
    }
  }

  const rows = Array.from(recipientIds).map((userId) => ({
    user_id: userId,
    created_by_user_id: admin.id,
    title: parsed.data.title,
    body: parsed.data.body
  }))

  const { error, data } = await supabase.from('notifications').insert(rows).select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    actorUserId: admin.id,
    action: 'create',
    entityType: 'notification',
    entityId: data?.[0]?.id ?? null,
    metadata: { recipients: data?.length ?? 0, title: parsed.data.title }
  })

  return NextResponse.json({ message: 'Notification sent', count: data?.length ?? 0 }, { status: 201 })
}