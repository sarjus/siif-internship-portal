import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyProfileForm } from '@/components/dashboard/company-profile-form'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function CompanyProfilePage () {
  const user = await requireRole(['company', 'admin'])
  const supabase = getSupabaseAdminClient()
  const companyResult = await supabase.from('companies').select('id, company_name, description, website, logo').eq('user_id', user.id).maybeSingle()
  const company = companyResult.data ?? { id: '', company_name: user.company_name ?? user.full_name, description: '', website: '', logo: '' }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <CompanyProfileForm
        companyId={company.id}
        initialValues={{
          company_name: company.company_name ?? user.company_name ?? user.full_name,
          description: company.description ?? '',
          website: company.website ?? '',
          logo: company.logo ?? ''
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile tips</CardTitle>
          <CardDescription>Keep company details clear so candidates can evaluate your role quickly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            'Use a concise company description',
            'Keep website and logo up to date',
            'Show your hiring focus and team context',
            'Refresh details before publishing new internships'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{item}</div>)}
        </CardContent>
      </Card>
    </section>
  )
}
