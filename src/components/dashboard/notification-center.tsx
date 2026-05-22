'use client'

import { useState } from 'react'
import { Loader2, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DashboardListItem } from '@/lib/types'

const roles = [
  { id: 'student', label: 'Students' },
  { id: 'company', label: 'Companies' },
  { id: 'admin', label: 'Admins' }
] as const

export function NotificationCenter ({ items }: { items: DashboardListItem[] }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', body: '', target_roles: ['student'] as string[] })

  async function submitNotification (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to send notification')
      }

      setMessage(`Notification sent to ${result.count} recipients.`)
      setForm({ title: '', body: '', target_roles: ['student'] })
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Unable to send notification')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Broadcast updates to one or more user groups.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={submitNotification}>
          <Input required placeholder="Announcement title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Textarea required placeholder="Message" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  target_roles: current.target_roles.includes(role.id) ? current.target_roles.filter((value) => value !== role.id) : [...current.target_roles, role.id]
                }))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                {role.label}
                {form.target_roles.includes(role.id) ? <Badge variant="success">On</Badge> : <Badge variant="muted">Off</Badge>}
              </button>
            ))}
          </div>
          {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
              Send announcement
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent notices</p>
          {items.length > 0 ? items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                </div>
                <Badge variant={item.status === 'read' ? 'success' : 'warning'}>{item.status}</Badge>
              </div>
            </div>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No notifications sent yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}