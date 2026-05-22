import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type ActivityPayload = {
  actorUserId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

export async function logActivity (payload: ActivityPayload): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient()
    await supabase.from('activity_logs').insert({
      actor_user_id: payload.actorUserId ?? null,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId ?? null,
      metadata: payload.metadata ?? {}
    })
  } catch {
    // Audit logging should never block the main user flow.
  }
}