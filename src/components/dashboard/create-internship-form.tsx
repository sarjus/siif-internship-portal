'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const internshipTypes = ['full_time', 'part_time', 'remote', 'hybrid'] as const

export function CreateInternshipForm ({ companyId }: { companyId?: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: '12 weeks',
    stipend: 'Paid',
    skills_required: 'React, TypeScript',
    deadline: '',
    location: 'Hybrid',
    internship_type: 'hybrid' as typeof internshipTypes[number],
    openings: '1',
    company_id: companyId ?? ''
  })

  async function handleSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      const response = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills_required: form.skills_required.split(',').map((skill) => skill.trim()).filter(Boolean),
          openings: Number(form.openings)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to create internship')
      }

      setMessage('Internship created successfully.')
      setForm({
        ...form,
        title: '',
        description: '',
        deadline: ''
      })
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Unable to create internship')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create internship</CardTitle>
        <CardDescription>Company and incubator admins can publish opportunities from here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input required placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="md:col-span-2" />
          <Textarea required placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="md:col-span-2" />
          <Input required placeholder="Duration" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
          <Input required placeholder="Stipend" value={form.stipend} onChange={(event) => setForm({ ...form, stipend: event.target.value })} />
          <Input required placeholder="Skills required" value={form.skills_required} onChange={(event) => setForm({ ...form, skills_required: event.target.value })} className="md:col-span-2" />
          <Input required type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          <Input required placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <select value={form.internship_type} onChange={(event) => setForm({ ...form, internship_type: event.target.value as typeof internshipTypes[number] })} className="h-11 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
            {internshipTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
          </select>
          <Input required type="number" min="1" placeholder="Openings" value={form.openings} onChange={(event) => setForm({ ...form, openings: event.target.value })} />
          <Input value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })} placeholder="Company ID (optional for admin)" className="md:col-span-2" />
          {message ? <p className="md:col-span-2 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish internship
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
