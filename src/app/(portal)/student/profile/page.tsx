import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentProfileForm } from '@/components/dashboard/student-profile-form'
import { requireRole } from '@/lib/auth/guards'

type StudentProfilePageProps = {
  searchParams?: {
    redirect?: string
  }
}

function getSafeRedirectPath (value: string | undefined): string | undefined {
  if (!value || !value.startsWith('/')) {
    return undefined
  }

  return value
}

export default async function StudentProfilePage ({ searchParams }: StudentProfilePageProps) {
  const user = await requireRole(['student'])
  const supabase = getSupabaseAdminClient()
  const redirectPath = getSafeRedirectPath(typeof searchParams?.redirect === 'string' ? searchParams.redirect : undefined)
  const profileResult = await supabase
    .from('student_profiles')
    .select('college_name, programme, study_year, current_cgpa, back_papers, department, skills, resume_url, github, linkedin, portfolio')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile = profileResult.data ?? {
    college_name: '',
    programme: '',
    study_year: '',
    current_cgpa: '',
    back_papers: 0,
    department: '',
    skills: [],
    resume_url: '',
    github: '',
    linkedin: '',
    portfolio: ''
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <StudentProfileForm
        userId={user.id}
        redirectPath={redirectPath}
        initialValues={{
          college_name: profile.college_name ?? '',
          programme: profile.programme ?? '',
          study_year: profile.study_year ?? '',
          current_cgpa: profile.current_cgpa ?? '',
          back_papers: profile.back_papers ?? 0,
          department: profile.department ?? '',
          skills: profile.skills ?? [],
          resume_url: profile.resume_url ?? '',
          github: profile.github ?? '',
          linkedin: profile.linkedin ?? '',
          portfolio: profile.portfolio ?? '',
          profile_image: ''
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile tips</CardTitle>
          <CardDescription>
            {redirectPath
              ? 'Complete your profile to continue with the internship application flow.'
              : 'Keep your details complete to improve internship discovery and shortlisting.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            'Add updated skills and current CGPA',
            'Upload latest resume in PDF format',
            'Keep portfolio and LinkedIn links active',
            'Review details before applying to openings'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
        </CardContent>
      </Card>
    </section>
  )
}
