'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InternshipEntryFields, type InternshipEntryFormState } from '@/components/dashboard/internship-entry-fields'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

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
  const [form, setForm] = useState<InternshipEntryFormState>({
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
          <InternshipEntryFields form={form} onChange={(next) => setForm(next)} showCompanyIdField />
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
