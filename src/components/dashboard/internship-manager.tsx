'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, PencilLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InternshipEntryFields, type InternshipEntryFormState } from '@/components/dashboard/internship-entry-fields'
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

function stripListPrefix (line: string): string {
  return line.replace(/^\d+\.\s+/, '').replace(/^[-*]\s+/, '').trim()
}

function parseInternshipDescription (description: string): Pick<InternshipEntryFormState, 'about' | 'who_can_apply' | 'other_requirements' | 'perks' | 'fee_type' | 'fee_amount' | 'fee_notes' | 'additional_info' | 'start_date' | 'skills_required'> {
  const parsed: Pick<InternshipEntryFormState, 'about' | 'who_can_apply' | 'other_requirements' | 'perks' | 'fee_type' | 'fee_amount' | 'fee_notes' | 'additional_info' | 'start_date' | 'skills_required'> = {
    about: '',
    who_can_apply: '',
    other_requirements: '',
    perks: '',
    fee_type: 'no_fee',
    fee_amount: '',
    fee_notes: '',
    additional_info: '',
    start_date: 'Immediately',
    skills_required: ''
  }

  const headerPattern = 'About the internship|Skill\\(s\\) required|Who can apply|Other requirements|Perks|Application fee|Additional information'
  const sectionRegex = new RegExp(`(?:^|\\n\\n)(${headerPattern}):\\n([\\s\\S]*?)(?=\\n\\n(?:${headerPattern}):\\n|$)`, 'g')
  const sections = new Map<string, string>()

  for (const match of description.matchAll(sectionRegex)) {
    const [, header, content] = match
    sections.set(header, content.trim())
  }

  if (sections.size === 0) {
    parsed.about = description.trim()
    return parsed
  }

  parsed.about = sections.get('About the internship') ?? ''

  const skills = sections.get('Skill(s) required')
  if (skills) {
    parsed.skills_required = skills
      .split('\n')
      .map(stripListPrefix)
      .filter(Boolean)
      .join(', ')
  }

  const whoCanApply = sections.get('Who can apply')
  if (whoCanApply) {
    parsed.who_can_apply = whoCanApply
      .split('\n')
      .map(stripListPrefix)
      .filter(Boolean)
      .join('\n')
  }

  const otherRequirements = sections.get('Other requirements')
  if (otherRequirements) {
    parsed.other_requirements = otherRequirements
      .split('\n')
      .map(stripListPrefix)
      .filter(Boolean)
      .join('\n')
  }

  const perks = sections.get('Perks')
  if (perks) {
    parsed.perks = perks
      .split('\n')
      .map(stripListPrefix)
      .filter(Boolean)
      .join('\n')
  }

  const fee = sections.get('Application fee')
  if (fee) {
    const feeLines = fee.split('\n').map((line) => line.trim()).filter(Boolean)
    const hasNoFee = feeLines.some((line) => /no fee charged/i.test(line))

    if (hasNoFee) {
      parsed.fee_type = 'no_fee'
    }

    for (const line of feeLines) {
      const cleanLine = stripListPrefix(line)
      if (/^type:/i.test(cleanLine)) {
        const value = cleanLine.replace(/^type:\s*/i, '').toLowerCase()
        if (value.includes('refundable')) parsed.fee_type = 'refundable'
        if (value.includes('one-time')) parsed.fee_type = 'one_time'
      }
      if (/^amount:/i.test(cleanLine)) {
        parsed.fee_amount = cleanLine.replace(/^amount:\s*/i, '').trim()
      }
      if (/^notes:/i.test(cleanLine)) {
        parsed.fee_notes = cleanLine.replace(/^notes:\s*/i, '').trim()
      }
    }
  }

  const additional = sections.get('Additional information')
  if (additional) {
    const additionalLines = additional.split('\n').map((line) => line.trim())
    const startDateLine = additionalLines.find((line) => /^start date:/i.test(line))
    if (startDateLine) {
      parsed.start_date = startDateLine.replace(/^start date:\s*/i, '').trim() || 'Immediately'
    }
    parsed.additional_info = additionalLines
      .filter((line) => line.length > 0 && !/^start date:/i.test(line))
      .join('\n')
      .trim()
  }

  return parsed
}

export function InternshipManager ({ companyId, adminMode = false }: { companyId?: string; adminMode?: boolean }) {
  const [internships, setInternships] = useState<Internship[]>([])
  const [busy, setBusy] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
    const parsedDescription = parseInternshipDescription(selected.description)

    setForm({
      title: selected.title,
      about: parsedDescription.about,
      who_can_apply: parsedDescription.who_can_apply,
      other_requirements: parsedDescription.other_requirements,
      perks: parsedDescription.perks,
      fee_type: parsedDescription.fee_type,
      fee_amount: parsedDescription.fee_amount,
      fee_notes: parsedDescription.fee_notes,
      additional_info: parsedDescription.additional_info,
      start_date: parsedDescription.start_date,
      duration: selected.duration,
      stipend: selected.stipend,
      skills_required: parsedDescription.skills_required || selected.skills_required.join(', '),
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved internships</CardTitle>
          <CardDescription>Manage your existing internship listings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedId ? 'Edit internship' : 'Create internship'}</CardTitle>
          <CardDescription>Connect with student talent by publishing detailed internship opportunities including role expectations, skills required, benefits, duration, and hiring timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submitInternship}>
            <InternshipEntryFields form={form} onChange={(next) => setForm(next)} showCompanyIdField={adminMode} />
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
        </CardContent>
      </Card>
    </div>
  )
}
