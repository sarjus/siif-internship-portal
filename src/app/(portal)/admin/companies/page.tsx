import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/guards'

type CompanyResultRow = {
  id: string
  company_name: string
  approved_status: boolean
  website: string | null
  users?: Array<{ email?: string | null }> | { email?: string | null } | null
}

export default async function AdminCompaniesPage () {
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
    <section className="grid gap-4 xl:grid-cols-2">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{company.company_name}</CardTitle>
                <CardDescription>{company.email}</CardDescription>
              </div>
              <Badge variant={company.approved_status ? 'success' : 'warning'}>{company.approved_status ? 'Approved' : 'Pending'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            {company.website || 'No website linked'}
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
