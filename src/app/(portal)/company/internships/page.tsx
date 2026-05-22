import { InternshipManager } from '@/components/dashboard/internship-manager'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function CompanyInternshipsPage () {
  const user = await requireRole(['company', 'admin'])
  const supabase = getSupabaseAdminClient()
  const companyResult = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()

  return <InternshipManager companyId={companyResult.data?.id ?? ''} />
}
