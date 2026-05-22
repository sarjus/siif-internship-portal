'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardListItem } from '@/lib/types'

const statuses = ['reviewing', 'shortlisted', 'rejected', 'interview', 'hired'] as const

export function ApplicationReviewBoard ({ items }: { items: DashboardListItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusById, setStatusById] = useState<Record<string, typeof statuses[number]>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function updateStatus (applicationId: string) {
    setBusyId(applicationId)
    setMessage(null)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusById[applicationId] ?? 'reviewing' })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to update application')
      setMessage('Application updated successfully.')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update application')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application review</CardTitle>
        <CardDescription>Shortlist, reject, and move candidates through the interview pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{item.status}</Badge>
                <select value={statusById[item.id] ?? 'reviewing'} onChange={(event) => setStatusById({ ...statusById, [item.id]: event.target.value as typeof statuses[number] })} className="h-10 rounded-full border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <Button size="sm" type="button" onClick={() => void updateStatus(item.id)} disabled={busyId === item.id}>
                  {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No applications to review yet.</p> : null}
      </CardContent>
    </Card>
  )
}
