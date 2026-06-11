import { ApplicationReviewBoard } from '@/components/dashboard/application-review-board'
import { ListPanel } from '@/components/dashboard/list-panel'
import { getCompanyDashboardData } from '@/lib/dashboard'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'
import { isIncompleteStudentProfile } from '@/lib/student-profile'

type CompanyApplicationRow = {
  id: string
  status: string
  applied_date: string | null
  student_id: string
  internship_id: string
  resume_url: string | null
}

type StudentProfileRow = {
  college_name?: string | null
  programme?: string | null
  study_year?: string | null
  current_cgpa?: string | null
  back_papers?: number | null
  department?: string | null
  skills?: string[] | null
  github?: string | null
  linkedin?: string | null
  portfolio?: string | null
  resume_url?: string | null
}

type StudentRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  profile_image: string | null
  student_profiles?: StudentProfileRow[] | StudentProfileRow | null
}

export default async function CompanyApplicationsPage () {
  const user = await requireRole(['company', 'admin'])
  const supabase = getSupabaseAdminClient()

  const [data, companyResult] = await Promise.all([
    getCompanyDashboardData(user),
    supabase.from('companies').select('id, company_name, description, website, logo').eq('user_id', user.id).maybeSingle()
  ])

  const company = companyResult.data ?? { id: '', company_name: user.company_name ?? user.full_name, description: '', website: '', logo: '' }

  const { data: companyInternships } = await supabase
    .from('internships')
    .select('id, title')
    .eq('company_id', company.id)

  const internshipIds = (companyInternships ?? []).map((i) => i.id)
  const internshipTitleById = new Map((companyInternships ?? []).map((i) => [i.id, i.title]))

  const { data: rawApplications } = internshipIds.length > 0
    ? await supabase
      .from('applications')
      .select('id, status, applied_date, student_id, internship_id, resume_url')
      .in('internship_id', internshipIds)
      .order('applied_date', { ascending: false })
    : { data: [] as CompanyApplicationRow[] }

  const applicationRows = (rawApplications ?? []) as CompanyApplicationRow[]
  const studentIds = Array.from(new Set(applicationRows.map((a) => a.student_id).filter(Boolean)))

  const { data: rawStudents } = studentIds.length > 0
    ? await supabase
      .from('users')
      .select('id, full_name, email, phone, profile_image, student_profiles(college_name, programme, study_year, current_cgpa, back_papers, department, skills, github, linkedin, portfolio, resume_url)')
      .in('id', studentIds)
    : { data: [] as StudentRow[] }

  const studentsById = new Map<string, StudentRow>((rawStudents ?? []).map((s: StudentRow) => [s.id, s]))

  const applications = applicationRows
    .filter((application) => {
      const student = studentsById.get(application.student_id)
      const profile = Array.isArray(student?.student_profiles) ? student?.student_profiles[0] ?? null : student?.student_profiles ?? null
      const profileWithPhone = { ...((profile ?? {}) as object), phone: student?.phone ?? null } as Parameters<typeof isIncompleteStudentProfile>[0]
      return !isIncompleteStudentProfile(profileWithPhone)
    })
    .map((application) => {
      const student = studentsById.get(application.student_id)
      const profile = Array.isArray(student?.student_profiles) ? student?.student_profiles[0] ?? null : student?.student_profiles ?? null

      return {
        id: application.id,
        title: internshipTitleById.get(application.internship_id) ?? 'Application',
        subtitle: student?.full_name ?? `Student ${application.student_id}`,
        status: application.status,
        meta: application.applied_date,
        applicant: {
          name: student?.full_name ?? 'Unknown applicant',
          email: student?.email ?? '',
          phone: student?.phone ?? '',
          college_name: profile?.college_name ?? '',
          programme: profile?.programme ?? '',
          study_year: profile?.study_year ?? '',
          current_cgpa: profile?.current_cgpa ?? '',
          back_papers: profile?.back_papers ?? null,
          department: profile?.department ?? '',
          skills: profile?.skills ?? [],
          github: profile?.github ?? '',
          linkedin: profile?.linkedin ?? '',
          portfolio: profile?.portfolio ?? '',
          resume_url: application.resume_url ?? profile?.resume_url ?? '',
          applied_date: application.applied_date ?? ''
        }
      }
    })

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <ApplicationReviewBoard items={applications} />
      <ListPanel title="Applications queue" description="Recent submissions and review markers." items={data.recent} />
    </section>
  )
}
