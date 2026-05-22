import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyApprovalPanel } from '@/components/dashboard/company-approval-panel'
import { InternshipManager } from '@/components/dashboard/internship-manager'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'

type CompanyResultRow = {
  id: string
  company_name: string
  approved_status: boolean
  website: string | null
  users?: Array<{ email?: string | null }> | { email?: string | null } | null
}

export default async function AdminApprovalsPage () {
  await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()
  const companiesResult = await supabase.from('companies').select('id, company_name, approved_status, website, users(email)').order('approved_status', { ascending: true }).limit(8)

  const companies = (companiesResult.data ?? [] as CompanyResultRow[]).map((company) => {
    const companyUser = Array.isArray(company.users) ? company.users[0] ?? null : company.users ?? null

    return {
      id: company.id,
      company_name: company.company_name,
      email: companyUser?.email ?? 'Unknown',
      approved_status: company.approved_status,
      website: company.website
    }
  })

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <CompanyApprovalPanel companies={companies} />
      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>Company onboarding and account status operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Use this page to enable or suspend accounts and manage internships tied to the incubator.</p>
        </CardContent>
      </Card>
      <div className="xl:col-span-2">
        <InternshipManager adminMode />
      </div>
    </section>
  )
}
