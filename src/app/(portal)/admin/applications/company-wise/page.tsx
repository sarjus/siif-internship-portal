import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type ApplicationRow = {
  id: string
  status: string
  student_id: string
  applied_date: string | null
  users?:
  | {
    full_name?: string | null
    email?: string | null
  }
  | Array<{
    full_name?: string | null
    email?: string | null
  }>
  | null
  internships?: {
    id?: string | null
    company_id?: string | null
    title?: string | null
  } | null
}

type CompanyRow = {
  id: string
  company_name: string | null
}

type CompanyStatusSummary = {
  companyId: string
  companyName: string
  totalApplications: number
  uniqueStudents: number
  submitted: number
  reviewing: number
  shortlisted: number
  interview: number
  hired: number
  rejected: number
}

type InternshipApplicant = {
  applicationId: string
  studentId: string
  studentName: string
  studentEmail: string
  status: string
  appliedDate: string | null
}

type InternshipBreakdown = {
  internshipId: string
  internshipTitle: string
  totalApplications: number
  submitted: number
  reviewing: number
  shortlisted: number
  interview: number
  hired: number
  rejected: number
  applicants: InternshipApplicant[]
}

type CompanyBreakdown = {
  companyId: string
  companyName: string
  totalApplications: number
  uniqueStudentIds: Set<string>
  submitted: number
  reviewing: number
  shortlisted: number
  interview: number
  hired: number
  rejected: number
  internships: Map<string, InternshipBreakdown>
}

type CompanyInternshipDetails = {
  companyId: string
  companyName: string
  totalApplications: number
  uniqueStudents: number
  internships: InternshipBreakdown[]
}

type AdminCompanyWiseApplicationStatusPageProps = {
  searchParams?: {
    company?: string
  }
}

function bumpStatus (bucket: {
  submitted: number
  reviewing: number
  shortlisted: number
  interview: number
  hired: number
  rejected: number
}, status: string): void {
  if (status === 'submitted') bucket.submitted += 1
  if (status === 'reviewing') bucket.reviewing += 1
  if (status === 'shortlisted') bucket.shortlisted += 1
  if (status === 'interview') bucket.interview += 1
  if (status === 'hired') bucket.hired += 1
  if (status === 'rejected') bucket.rejected += 1
}

function toSummaryRows (applications: ApplicationRow[], companyNameById: Map<string, string>): CompanyStatusSummary[] {
  const companyBuckets = new Map<string, {
    companyName: string
    totalApplications: number
    uniqueStudentIds: Set<string>
    submitted: number
    reviewing: number
    shortlisted: number
    interview: number
    hired: number
    rejected: number
  }>()

  for (const application of applications) {
    const companyId = application.internships?.company_id
    if (!companyId) continue

    const existing = companyBuckets.get(companyId) ?? {
      companyName: companyNameById.get(companyId) ?? 'Company',
      totalApplications: 0,
      uniqueStudentIds: new Set<string>(),
      submitted: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0
    }

    existing.totalApplications += 1
    existing.uniqueStudentIds.add(application.student_id)

    if (application.status === 'submitted') existing.submitted += 1
    if (application.status === 'reviewing') existing.reviewing += 1
    if (application.status === 'shortlisted') existing.shortlisted += 1
    if (application.status === 'interview') existing.interview += 1
    if (application.status === 'hired') existing.hired += 1
    if (application.status === 'rejected') existing.rejected += 1

    companyBuckets.set(companyId, existing)
  }

  return Array.from(companyBuckets.entries())
    .map(([companyId, value]) => ({
      companyId,
      companyName: value.companyName,
      totalApplications: value.totalApplications,
      uniqueStudents: value.uniqueStudentIds.size,
      submitted: value.submitted,
      reviewing: value.reviewing,
      shortlisted: value.shortlisted,
      interview: value.interview,
      hired: value.hired,
      rejected: value.rejected
    }))
    .sort((a, b) => b.totalApplications - a.totalApplications)
}

function toCompanyInternshipDetails (applications: ApplicationRow[], companyNameById: Map<string, string>): CompanyInternshipDetails[] {
  const companyBuckets = new Map<string, CompanyBreakdown>()

  for (const application of applications) {
    const companyId = application.internships?.company_id
    const internshipId = application.internships?.id
    if (!companyId || !internshipId) continue

    const companyBucket = companyBuckets.get(companyId) ?? {
      companyId,
      companyName: companyNameById.get(companyId) ?? 'Company',
      totalApplications: 0,
      uniqueStudentIds: new Set<string>(),
      submitted: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
      internships: new Map<string, InternshipBreakdown>()
    }

    const internshipBucket = companyBucket.internships.get(internshipId) ?? {
      internshipId,
      internshipTitle: application.internships?.title ?? 'Internship call',
      totalApplications: 0,
      submitted: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
      applicants: []
    }

    const user = Array.isArray(application.users) ? application.users[0] ?? null : application.users ?? null

    internshipBucket.totalApplications += 1
    internshipBucket.applicants.push({
      applicationId: application.id,
      studentId: application.student_id,
      studentName: user?.full_name ?? 'Student',
      studentEmail: user?.email ?? 'Not available',
      status: application.status,
      appliedDate: application.applied_date
    })
    bumpStatus(internshipBucket, application.status)

    companyBucket.totalApplications += 1
    companyBucket.uniqueStudentIds.add(application.student_id)
    bumpStatus(companyBucket, application.status)

    companyBucket.internships.set(internshipId, internshipBucket)
    companyBuckets.set(companyId, companyBucket)
  }

  return Array.from(companyBuckets.values())
    .map((company) => ({
      companyId: company.companyId,
      companyName: company.companyName,
      totalApplications: company.totalApplications,
      uniqueStudents: company.uniqueStudentIds.size,
      internships: Array.from(company.internships.values())
        .sort((a, b) => b.totalApplications - a.totalApplications)
    }))
    .sort((a, b) => b.totalApplications - a.totalApplications)
}

export default async function AdminCompanyWiseApplicationStatusPage ({ searchParams }: AdminCompanyWiseApplicationStatusPageProps) {
  await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()
  const companyQuery = typeof searchParams?.company === 'string' ? searchParams.company.trim().toLowerCase() : ''

  const [applicationsResult, companiesResult] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, student_id, applied_date, users(full_name, email), internships(id, company_id, title)')
      .order('applied_date', { ascending: false }),
    supabase.from('companies').select('id, company_name')
  ])

  const applications = (applicationsResult.data ?? []) as ApplicationRow[]
  const companies = (companiesResult.data ?? []) as CompanyRow[]

  const companyNameById = new Map<string, string>(companies.map((company) => [company.id, company.company_name ?? 'Company']))
  const allSummaryRows = toSummaryRows(applications, companyNameById)
  const allCompanyDetails = toCompanyInternshipDetails(applications, companyNameById)

  const companyDetails = companyQuery
    ? allCompanyDetails.filter((company) => company.companyName.toLowerCase().includes(companyQuery))
    : allCompanyDetails

  const visibleCompanyIds = new Set(companyDetails.map((company) => company.companyId))
  const summaryRows = allSummaryRows.filter((row) => visibleCompanyIds.has(row.companyId))
  const visibleApplications = applications.filter((application) => {
    const companyId = application.internships?.company_id
    return companyId ? visibleCompanyIds.has(companyId) : false
  })

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company-wise applied student status</CardTitle>
          <CardDescription>
            Track how student applications are distributed across companies and status stages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label htmlFor="company-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Search company
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="company-search"
                name="company"
                defaultValue={typeof searchParams?.company === 'string' ? searchParams.company : ''}
                placeholder="Type company name"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full bg-aurora-500 px-4 text-sm font-semibold text-white transition hover:bg-aurora-600">
                  Search
                </button>
                <a href="/admin/applications/company-wise" className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Reset
                </a>
              </div>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Companies with applications</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{summaryRows.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total applications</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{visibleApplications.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Unique applicants</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{new Set(visibleApplications.map((item) => item.student_id)).size}</p>
            </div>
          </div>

          {summaryRows.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[980px] w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Unique students</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Total apps</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Submitted</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Reviewing</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Shortlisted</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Interview</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Hired</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {summaryRows.map((row) => (
                    <tr key={row.companyId}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.companyName}</td>
                      <td className="px-4 py-3 text-slate-700">{row.uniqueStudents}</td>
                      <td className="px-4 py-3 text-slate-700">{row.totalApplications}</td>
                      <td className="px-4 py-3 text-slate-700">{row.submitted}</td>
                      <td className="px-4 py-3 text-slate-700">{row.reviewing}</td>
                      <td className="px-4 py-3 text-slate-700">{row.shortlisted}</td>
                      <td className="px-4 py-3 text-slate-700">{row.interview}</td>
                      <td className="px-4 py-3 text-slate-700">{row.hired}</td>
                      <td className="px-4 py-3 text-slate-700">{row.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No application data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students by internship call</CardTitle>
          <CardDescription>
            For each company, expand internship calls to see applied students and their current application status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyDetails.length > 0 ? companyDetails.map((company) => (
            <details key={company.companyId} className="rounded-2xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{company.companyName}</p>
                    <p className="text-sm text-slate-600">{company.internships.length} internship call(s) · {company.uniqueStudents} unique student(s)</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {company.totalApplications} application(s)
                  </span>
                </div>
              </summary>

              <div className="mt-4 space-y-4">
                {company.internships.map((internship) => (
                  <div key={internship.internshipId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{internship.internshipTitle}</p>
                      <p className="text-xs text-slate-600">
                        Total: {internship.totalApplications} · Submitted: {internship.submitted} · Reviewing: {internship.reviewing} · Shortlisted: {internship.shortlisted} · Interview: {internship.interview} · Hired: {internship.hired} · Rejected: {internship.rejected}
                      </p>
                    </div>

                    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="min-w-[760px] w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Student</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Applied date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {internship.applicants.map((applicant) => (
                            <tr key={applicant.applicationId}>
                              <td className="px-3 py-2 text-slate-900">{applicant.studentName}</td>
                              <td className="px-3 py-2 text-slate-700">{applicant.studentEmail}</td>
                              <td className="px-3 py-2 text-slate-700">{applicant.status}</td>
                              <td className="px-3 py-2 text-slate-700">{applicant.appliedDate ? new Date(applicant.appliedDate).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No company internship application data available yet.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
