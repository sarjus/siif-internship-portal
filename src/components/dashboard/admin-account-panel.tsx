'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AccountRow = {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'company' | 'student'
  account_status: 'pending_approval' | 'active' | 'suspended' | 'disabled'
}

const accountStatuses = ['pending_approval', 'active', 'suspended', 'disabled'] as const

export function AdminAccountPanel ({ accounts }: { accounts: AccountRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusById, setStatusById] = useState<Record<string, typeof accountStatuses[number]>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function updateAccountStatus (userId: string) {
    setBusyId(userId)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/accounts/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: statusById[userId] ?? 'active' })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to update account')
      setMessage('Account updated successfully.')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update account')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account moderation</CardTitle>
        <CardDescription>Enable, suspend, or disable incubator user accounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
        {accounts.map((account) => (
          <div key={account.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-white">{account.full_name}</p>
                <p className="mt-1 text-sm text-slate-400">{account.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="info">{account.role}</Badge>
                  <Badge variant={account.account_status === 'active' ? 'success' : 'warning'}>{account.account_status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={statusById[account.id] ?? account.account_status} onChange={(event) => setStatusById({ ...statusById, [account.id]: event.target.value as typeof accountStatuses[number] })} className="h-10 rounded-full border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none">
                  {accountStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <Button size="sm" type="button" onClick={() => void updateAccountStatus(account.id)} disabled={busyId === account.id}>
                  {busyId === account.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ))}
        {accounts.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No accounts available.</p> : null}
      </CardContent>
    </Card>
  )
}
