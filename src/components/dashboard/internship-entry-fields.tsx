'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const internshipTypes = ['full_time', 'part_time', 'remote', 'hybrid'] as const

export type InternshipEntryFormState = {
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

type InternshipEntryFieldsProps = {
  form: InternshipEntryFormState
  onChange: (next: InternshipEntryFormState) => void
  showCompanyIdField?: boolean
}

type FieldBlockProps = {
  label: string
  className?: string
  children: ReactNode
}

function FieldBlock ({ label, className, children }: FieldBlockProps) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      {children}
    </div>
  )
}

export function InternshipEntryFields ({ form, onChange, showCompanyIdField = false }: InternshipEntryFieldsProps) {
  return (
    <>
      <FieldBlock label="Internship title" className="md:col-span-2">
        <Input required placeholder="Internship profile title (e.g., Human Resources HR Internship)" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="About internship" className="md:col-span-2">
        <Textarea required placeholder="About the internship" value={form.about} onChange={(event) => onChange({ ...form, about: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Skills required" className="md:col-span-2">
        <Input required placeholder="Skills required (comma separated)" value={form.skills_required} onChange={(event) => onChange({ ...form, skills_required: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Who can apply" className="md:col-span-2">
        <Textarea placeholder="Who can apply (one item per line)" value={form.who_can_apply} onChange={(event) => onChange({ ...form, who_can_apply: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Other requirements" className="md:col-span-2">
        <Textarea placeholder="Other requirements (one item per line)" value={form.other_requirements} onChange={(event) => onChange({ ...form, other_requirements: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Perks" className="md:col-span-2">
        <Textarea placeholder="Perks (one item per line, e.g., Certificate, Letter of recommendation)" value={form.perks} onChange={(event) => onChange({ ...form, perks: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Application fee type">
        <select value={form.fee_type} onChange={(event) => onChange({ ...form, fee_type: event.target.value as 'no_fee' | 'one_time' | 'refundable' })} className="h-11 w-full rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
          <option value="no_fee">No application fee</option>
          <option value="one_time">One-time application fee</option>
          <option value="refundable">Refundable application fee</option>
        </select>
      </FieldBlock>
      <FieldBlock label="Fee amount">
        <Input placeholder="Fee amount (e.g., INR 500)" value={form.fee_amount} onChange={(event) => onChange({ ...form, fee_amount: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Fee notes" className="md:col-span-2">
        <Textarea placeholder="Fee notes (optional)" value={form.fee_notes} onChange={(event) => onChange({ ...form, fee_notes: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Duration">
        <Input required placeholder="Duration (e.g., 3 months)" value={form.duration} onChange={(event) => onChange({ ...form, duration: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Stipend">
        <Input required placeholder="Stipend (e.g., INR 20000-25000 /month)" value={form.stipend} onChange={(event) => onChange({ ...form, stipend: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Start date">
        <Input placeholder="Start date (e.g., Immediately or 22 May 2026)" value={form.start_date} onChange={(event) => onChange({ ...form, start_date: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Application deadline">
        <Input required type="date" value={form.deadline} onChange={(event) => onChange({ ...form, deadline: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Location">
        <Input required placeholder="Location (e.g., Gurgaon or Remote)" value={form.location} onChange={(event) => onChange({ ...form, location: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Internship type">
        <select value={form.internship_type} onChange={(event) => onChange({ ...form, internship_type: event.target.value as typeof internshipTypes[number] })} className="h-11 w-full rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
          {internshipTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
        </select>
      </FieldBlock>
      <FieldBlock label="Openings">
        <Input required type="number" min="1" placeholder="Number of openings" value={form.openings} onChange={(event) => onChange({ ...form, openings: event.target.value })} />
      </FieldBlock>
      <FieldBlock label="Additional information" className="md:col-span-2">
        <Textarea placeholder="Additional information (optional)" value={form.additional_info} onChange={(event) => onChange({ ...form, additional_info: event.target.value })} />
      </FieldBlock>
      {showCompanyIdField ? (
        <FieldBlock label="Company ID" className="md:col-span-2">
          <Input value={form.company_id} onChange={(event) => onChange({ ...form, company_id: event.target.value })} placeholder="Company ID (optional for admin)" />
        </FieldBlock>
      ) : null}
    </>
  )
}