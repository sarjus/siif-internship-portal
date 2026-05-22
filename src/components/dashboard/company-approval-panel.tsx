'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

type CompanyRow = {
  id: string
  company_name: string
  email: string
  approved_status: boolean
  website: string | null
}

export function CompanyApprovalPanel ({ companies }: { companies: CompanyRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function setApproval (companyId: string, approved_status: boolean) {
    setBusyId(companyId)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_status })
      })
      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to update company approval'))
      setMessage('Company approval updated.')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update company approval')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company approvals</CardTitle>
        <CardDescription>Approve or suspend startup registrations before they access the portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
        {companies.map((company) => (
          <div key={company.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-white">{company.company_name}</p>
                <p className="mt-1 text-sm text-slate-400">{company.email}</p>
                {company.website ? <p className="mt-1 text-xs text-slate-500">{company.website}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={company.approved_status ? 'success' : 'warning'}>{company.approved_status ? 'approved' : 'pending'}</Badge>
                <Button size="sm" variant="outline" type="button" onClick={() => void setApproval(company.id, true)} disabled={busyId === company.id}>
                  {busyId === company.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => void setApproval(company.id, false)} disabled={busyId === company.id}>
                  {busyId === company.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Suspend
                </Button>
              </div>
            </div>
          </div>
        ))}
        {companies.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No companies pending review.</p> : null}
      </CardContent>
    </Card>
  )
}
