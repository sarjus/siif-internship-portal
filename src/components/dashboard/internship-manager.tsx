'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, PencilLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

type Internship = {
  id: string
  company_id: string
  title: string
  description: string
  duration: string
  stipend: string
  skills_required: string[]
  deadline: string
  location: string
  internship_type: 'full_time' | 'part_time' | 'remote' | 'hybrid'
  openings: number
  companies?: { company_name?: string | null } | null
}

const internshipTypes = ['full_time', 'part_time', 'remote', 'hybrid'] as const

type InternshipFormState = {
  title: string
  about: string
  who_can_apply: string
  other_requirements: string
  perks: string
  fee_type: 'no_fee' | 'one_time' | 'refundable'
  fee_amount: string
  fee_notes: string
  additional_info: string
  start_date: string
  duration: string
  stipend: string
  skills_required: string
  deadline: string
  location: string
  internship_type: (typeof internshipTypes)[number]
  openings: string
  company_id: string
}

function formatAsNumberedList (value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n')
}

function formatAsBulletList (value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join('\n')
}

function formatCommaSeparatedAsBulletList (value: string): string {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join('\n')
}

function buildInternshipDescription (form: {
  about: string
  skills_required: string
  who_can_apply: string
  other_requirements: string
  perks: string
  fee_type: 'no_fee' | 'one_time' | 'refundable'
  fee_amount: string
  fee_notes: string
  additional_info: string
  start_date: string
}): string {
  const sections: string[] = []

  sections.push(`About the internship:\n${form.about.trim()}`)

  if (form.skills_required.trim()) {
    sections.push(`Skill(s) required:\n${formatCommaSeparatedAsBulletList(form.skills_required)}`)
  }

  if (form.who_can_apply.trim()) {
    sections.push(`Who can apply:\n${formatAsNumberedList(form.who_can_apply)}`)
  }

  if (form.other_requirements.trim()) {
    sections.push(`Other requirements:\n${formatAsNumberedList(form.other_requirements)}`)
  }

  if (form.perks.trim()) {
    sections.push(`Perks:\n${formatAsBulletList(form.perks)}`)
  }

  if (form.fee_type !== 'no_fee' || form.fee_amount.trim() || form.fee_notes.trim()) {
    const feeLines: string[] = []
    feeLines.push(`- Type: ${form.fee_type === 'refundable' ? 'Refundable fee' : 'One-time fee'}`)

    if (form.fee_amount.trim()) {
      feeLines.push(`- Amount: ${form.fee_amount.trim()}`)
    }

    if (form.fee_notes.trim()) {
      feeLines.push(`- Notes: ${form.fee_notes.trim()}`)
    }

    sections.push(`Application fee:\n${feeLines.join('\n')}`)
  } else {
    sections.push('Application fee:\n- No fee charged from students')
  }

  if (form.start_date.trim() || form.additional_info.trim()) {
    const info: string[] = []
    if (form.start_date.trim()) {
      info.push(`Start date: ${form.start_date.trim()}`)
    }
    if (form.additional_info.trim()) {
      info.push(form.additional_info.trim())
    }
    sections.push(`Additional information:\n${info.join('\n')}`)
  }

  return sections.join('\n\n')
}

export function InternshipManager ({ companyId, adminMode = false }: { companyId?: string; adminMode?: boolean }) {
  const [internships, setInternships] = useState<Internship[]>([])
  const [busy, setBusy] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<InternshipFormState>({
    title: '',
    about: '',
    who_can_apply: '',
    other_requirements: '',
    perks: '',
    fee_type: 'no_fee',
    fee_amount: '',
    fee_notes: '',
    additional_info: '',
    start_date: 'Immediately',
    duration: '12 weeks',
    stipend: 'Paid',
    skills_required: 'React, TypeScript [Skills Required]',
    deadline: '',
    location: 'Hybrid',
    internship_type: 'hybrid',
    openings: '1',
    company_id: companyId ?? ''
  })

  const loadInternships = useCallback(async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/internships', { cache: 'no-store' })
      const result = await readJsonResponse<{ error?: string; message?: string; internships?: Internship[] }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to load internships'))
      setInternships((result.internships ?? []).filter((internship: Internship) => adminMode || !companyId || internship.company_id === companyId))
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : 'Unable to load internships')
    } finally {
      setBusy(false)
    }
  }, [adminMode, companyId])

  useEffect(() => {
    void loadInternships()
  }, [loadInternships])

  const selected = useMemo(() => internships.find((internship) => internship.id === selectedId) ?? null, [internships, selectedId])

  useEffect(() => {
    if (!selected) return
    setForm({
      title: selected.title,
      about: selected.description,
      who_can_apply: '',
      other_requirements: '',
      perks: '',
      fee_type: 'no_fee',
      fee_amount: '',
      fee_notes: '',
      additional_info: '',
      start_date: 'Immediately',
      duration: selected.duration,
      stipend: selected.stipend,
      skills_required: selected.skills_required.join(', '),
      deadline: selected.deadline,
      location: selected.location,
      internship_type: selected.internship_type,
      openings: String(selected.openings),
      company_id: selected.company_id
    })
  }, [selected])

  async function submitInternship (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingId(selectedId ?? 'new')
    setMessage(null)

    try {
      const description = buildInternshipDescription(form)
      const response = await fetch(selectedId ? `/api/internships/${selectedId}` : '/api/internships', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description,
          duration: form.duration,
          stipend: form.stipend,
          deadline: form.deadline,
          location: form.location,
          internship_type: form.internship_type,
          company_id: form.company_id,
          skills_required: form.skills_required.split(',').map((skill) => skill.trim()).filter(Boolean),
          openings: Number(form.openings)
        })
      })
      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to save internship'))
      setMessage(selectedId ? 'Internship updated.' : 'Internship created.')
      setSelectedId(null)
      setForm({
        title: '',
        about: '',
        who_can_apply: '',
        other_requirements: '',
        perks: '',
        fee_type: 'no_fee',
        fee_amount: '',
        fee_notes: '',
        additional_info: '',
        start_date: 'Immediately',
        duration: '12 weeks',
        stipend: 'Paid',
        skills_required: 'React, TypeScript [Skills Required]',
        deadline: '',
        location: 'Hybrid',
        internship_type: 'hybrid',
        openings: '1',
        company_id: companyId ?? ''
      })
      await loadInternships()
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Unable to save internship')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteInternship (internshipId: string) {
    setSavingId(internshipId)
    setMessage(null)
    try {
      const response = await fetch(`/api/internships/${internshipId}`, { method: 'DELETE' })
      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to delete internship'))
      await loadInternships()
      if (selectedId === internshipId) setSelectedId(null)
      setMessage('Internship deleted.')
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : 'Unable to delete internship')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedId ? 'Edit internship' : 'Create internship'}</CardTitle>
        <CardDescription>Publish opportunities with Internshala-style details: about, responsibilities, requirements, perks, and application timeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitInternship}>
          <Input required placeholder="Internship profile title (e.g., Human Resources HR Internship)" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="md:col-span-2" />
          <Textarea required placeholder="About the internship" value={form.about} onChange={(event) => setForm({ ...form, about: event.target.value })} className="md:col-span-2" />
          <Input required placeholder="Skills required (comma separated)" value={form.skills_required} onChange={(event) => setForm({ ...form, skills_required: event.target.value })} className="md:col-span-2" />
          <Textarea placeholder="Who can apply (one item per line)" value={form.who_can_apply} onChange={(event) => setForm({ ...form, who_can_apply: event.target.value })} className="md:col-span-2" />
          <Textarea placeholder="Other requirements (one item per line)" value={form.other_requirements} onChange={(event) => setForm({ ...form, other_requirements: event.target.value })} className="md:col-span-2" />
          <Textarea placeholder="Perks (one item per line, e.g., Certificate, Letter of recommendation)" value={form.perks} onChange={(event) => setForm({ ...form, perks: event.target.value })} className="md:col-span-2" />
          <select value={form.fee_type} onChange={(event) => setForm({ ...form, fee_type: event.target.value as 'no_fee' | 'one_time' | 'refundable' })} className="h-11 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
            <option value="no_fee">No application fee</option>
            <option value="one_time">One-time application fee</option>
            <option value="refundable">Refundable application fee</option>
          </select>
          <Input placeholder="Fee amount (e.g., INR 500)" value={form.fee_amount} onChange={(event) => setForm({ ...form, fee_amount: event.target.value })} />
          <Textarea placeholder="Fee notes (optional)" value={form.fee_notes} onChange={(event) => setForm({ ...form, fee_notes: event.target.value })} className="md:col-span-2" />
          <Input required placeholder="Duration (e.g., 3 months)" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
          <Input required placeholder="Stipend (e.g., INR 20000-25000 /month)" value={form.stipend} onChange={(event) => setForm({ ...form, stipend: event.target.value })} />
          <Input placeholder="Start date (e.g., Immediately or 22 May 2026)" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
          <Input required type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          <Input required placeholder="Location (e.g., Gurgaon or Remote)" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <select value={form.internship_type} onChange={(event) => setForm({ ...form, internship_type: event.target.value as typeof internshipTypes[number] })} className="h-11 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
            {internshipTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
          </select>
          <Input required type="number" min="1" placeholder="Number of openings" value={form.openings} onChange={(event) => setForm({ ...form, openings: event.target.value })} />
          <Textarea placeholder="Additional information (optional)" value={form.additional_info} onChange={(event) => setForm({ ...form, additional_info: event.target.value })} className="md:col-span-2" />
          {adminMode ? <Input value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })} placeholder="Company ID" className="md:col-span-2" /> : null}
          {message ? <p className="md:col-span-2 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            {selectedId ? (
              <Button variant="outline" type="button" onClick={() => { setSelectedId(null); setMessage(null) }}>
                Cancel edit
              </Button>
            ) : null}
            <Button type="submit" disabled={savingId !== null}>
              {savingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {selectedId ? 'Update internship' : 'Create internship'}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Saved internships</h4>
            {busy ? <span className="text-xs text-slate-400">Refreshing...</span> : null}
          </div>
          <div className="space-y-3">
            {internships.map((internship) => (
              <div key={internship.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{internship.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{internship.location} · {internship.internship_type} · {internship.openings} openings</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{internship.deadline}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => setSelectedId(internship.id)}>
                      <PencilLine className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" type="button" onClick={() => void deleteInternship(internship.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {internships.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No internships yet.</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
