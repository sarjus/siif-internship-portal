'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

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

export function CreateInternshipForm ({ companyId }: { companyId?: string }) {
  const [busy, setBusy] = useState(false)
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

  async function handleSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      const description = buildInternshipDescription(form)
      const response = await fetch('/api/internships', {
        method: 'POST',
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

      if (!response.ok) {
        throw new Error(getResponseMessage(result, 'Unable to create internship'))
      }

      setMessage('Internship created successfully.')
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
        <CardDescription>Create posting-style internships with responsibilities, requirements, perks, and timeline details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
