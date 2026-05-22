import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { InternshipBrowser } from '@/components/dashboard/internship-browser'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentBrowsePage () {
  const user = await requireRole(['student'])
  const supabase = getSupabaseAdminClient()
  const profileResult = await supabase.from('student_profiles').select('resume_url').eq('user_id', user.id).maybeSingle()

  return <InternshipBrowser resumeUrl={profileResult.data?.resume_url ?? ''} />
}
