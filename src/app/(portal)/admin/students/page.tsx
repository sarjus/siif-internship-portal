import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentRegistrationPanel } from '@/components/dashboard/student-registration-panel'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'

type StudentProfileRelation = {
  college_name?: string | null
  programme?: string | null
  study_year?: string | null
  current_cgpa?: string | null
  back_papers?: number | null
  department?: string | null
  skills?: string[] | null
  resume_url?: string | null
  github?: string | null
  linkedin?: string | null
  portfolio?: string | null
}

type StudentResultRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  account_status: 'pending_approval' | 'active' | 'suspended' | 'disabled'
  created_at: string
  student_profiles?: StudentProfileRelation[] | StudentProfileRelation | null
}

type AdminStudentsPageProps = {
  searchParams?: {
    completion?: string
  }
}

function getInitialCompletionFilter (value: string | undefined): 'all' | 'incomplete' | 'complete' {
  if (value === 'incomplete' || value === 'complete') {
    return value
  }

  return 'all'
}

export default async function AdminStudentsPage ({ searchParams }: AdminStudentsPageProps) {
  await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()
  const initialCompletionFilter = getInitialCompletionFilter(typeof searchParams?.completion === 'string' ? searchParams.completion : undefined)

  const studentsResult = await supabase
    .from('users')
    .select('id, full_name, email, phone, account_status, created_at, student_profiles(college_name, programme, study_year, current_cgpa, back_papers, department, skills, resume_url, github, linkedin, portfolio)')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  const students = (studentsResult.data ?? [] as StudentResultRow[]).map((student) => {
    const profile = Array.isArray(student.student_profiles)
      ? student.student_profiles[0] ?? null
      : student.student_profiles ?? null

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      account_status: student.account_status,
      created_at: student.created_at,
      college_name: profile?.college_name ?? null,
      programme: profile?.programme ?? null,
      study_year: profile?.study_year ?? null,
      current_cgpa: profile?.current_cgpa ?? null,
      back_papers: profile?.back_papers ?? 0,
      department: profile?.department ?? null,
      skills: profile?.skills ?? [],
      resume_url: profile?.resume_url ?? null,
      github: profile?.github ?? null,
      linkedin: profile?.linkedin ?? null,
      portfolio: profile?.portfolio ?? null
    }
  })

  const total = students.length
  const pending = students.filter((student) => student.account_status === 'pending_approval').length
  const suspended = students.filter((student) => student.account_status === 'suspended' || student.account_status === 'disabled').length

  return (
    <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <StudentRegistrationPanel students={students} initialCompletionFilter={initialCompletionFilter} />
      <Card className="h-fit 2xl:sticky 2xl:top-6">
        <CardHeader>
          <CardTitle>Registration insights</CardTitle>
          <CardDescription>Current status of student onboarding records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total registrations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Pending review</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-700">Restricted accounts</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{suspended}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
