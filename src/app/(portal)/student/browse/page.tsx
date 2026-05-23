import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { InternshipBrowser } from '@/components/dashboard/internship-browser'
import { requireRole } from '@/lib/auth/guards'

type StudentBrowsePageProps = {
  searchParams?: {
    internship?: string
  }
}

export default async function StudentBrowsePage ({ searchParams }: StudentBrowsePageProps) {
  const user = await requireRole(['student'])
  const supabase = getSupabaseAdminClient()
  const profileResult = await supabase.from('student_profiles').select('resume_url').eq('user_id', user.id).maybeSingle()
  const selectedInternshipId = typeof searchParams?.internship === 'string' && searchParams.internship ? searchParams.internship : undefined

  return <InternshipBrowser resumeUrl={profileResult.data?.resume_url ?? ''} initialInternshipId={selectedInternshipId} />
}
