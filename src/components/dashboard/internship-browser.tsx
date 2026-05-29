'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

type Internship = {
  id: string
  company_id: string
  title: string
  description: string
  stipend: string
  location: string
  internship_type: 'full_time' | 'part_time' | 'remote' | 'hybrid'
  deadline: string
  skills_required: string[]
  openings: number
  applied?: boolean
  companies?: {
    company_name?: string | null
    description?: string | null
    website?: string | null
    logo?: string | null
  } | null
}

type InternshipDescriptionSections = {
  about?: string
  skills: string[]
  whoCanApply: string[]
  responsibilities: string[]
  requirements: string[]
  perks: string[]
  fee: string[]
  additionalInfo: string[]
  fallback?: string
}

function normalizeListLine (line: string): string {
  return line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim()
}

function parseStructuredDescription (description: string): InternshipDescriptionSections {
  const trimmed = description.trim()

  if (!trimmed) {
    return {
      skills: [],
      whoCanApply: [],
      responsibilities: [],
      requirements: [],
      perks: [],
      fee: [],
      additionalInfo: [],
      fallback: ''
    }
  }

  const sections = trimmed.split(/\n\s*\n/)
  const result: InternshipDescriptionSections = {
    skills: [],
    whoCanApply: [],
    responsibilities: [],
    requirements: [],
    perks: [],
    fee: [],
    additionalInfo: []
  }

  for (const section of sections) {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean)

    if (lines.length === 0) continue

    const heading = lines[0].toLowerCase()
    const body = lines.slice(1)

    if (heading.startsWith('about the internship:')) {
      result.about = body.join(' ')
      continue
    }

    if (heading.startsWith('skill(s) required:')) {
      result.skills = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith('who can apply:')) {
      result.whoCanApply = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith("selected intern's day-to-day responsibilities include:")) {
      result.responsibilities = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith('other requirements:')) {
      result.requirements = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith('perks:')) {
      result.perks = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith('application fee:')) {
      result.fee = body.map(normalizeListLine).filter(Boolean)
      continue
    }

    if (heading.startsWith('additional information:')) {
      result.additionalInfo = body.map(normalizeListLine).filter(Boolean)
      continue
    }
  }

  const hasStructuredContent =
    !!result.about ||
    result.skills.length > 0 ||
    result.whoCanApply.length > 0 ||
    result.responsibilities.length > 0 ||
    result.requirements.length > 0 ||
    result.perks.length > 0 ||
    result.fee.length > 0 ||
    result.additionalInfo.length > 0

  if (!hasStructuredContent) {
    result.fallback = description
  }

  return result
}

export function InternshipBrowser ({ resumeUrl, initialInternshipId }: { resumeUrl: string; initialInternshipId?: string }) {
  const router = useRouter()
  const [items, setItems] = useState<Internship[]>([])
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [didAutoFocus, setDidAutoFocus] = useState(false)

  useEffect(() => {
    void fetch('/api/internships', { cache: 'no-store' })
      .then(async (response) => {
        const result = await readJsonResponse<{ error?: string; message?: string; internships?: Internship[] }>(response)
        if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to load internships'))
        setItems(result.internships ?? [])
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load internships')
      })
  }, [])

  useEffect(() => {
    if (!initialInternshipId || didAutoFocus) return

    const hasSelectedInternship = items.some((item) => item.id === initialInternshipId)
    if (!hasSelectedInternship) return

    setExpandedCompanyId(initialInternshipId)

    const scrollTarget = document.getElementById(`internship-card-${initialInternshipId}`)
    if (scrollTarget) {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    setDidAutoFocus(true)
  }, [didAutoFocus, initialInternshipId, items])

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return items

    return items.filter((item) => [
      item.title,
      item.location,
      item.internship_type,
      item.skills_required.join(' '),
      item.companies?.company_name ?? '',
      item.companies?.description ?? ''
    ].join(' ').toLowerCase().includes(value))
  }, [items, query])

  async function applyToInternship (internshipId: string) {
    setBusyId(internshipId)
    setMessage(null)
    try {
      const response = await fetch(`/api/internships/${internshipId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_url: resumeUrl })
      })
      const result = await readJsonResponse<{ error?: string; message?: string; redirectTo?: string }>(response)
      if (response.status === 403 && typeof result.redirectTo === 'string' && result.redirectTo) {
        router.push(`${result.redirectTo}?redirect=/student/browse?internship=${internshipId}`)
        return
      }
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to submit application'))
      setMessage('Application submitted successfully.')
      setItems((current) => current.map((item) => item.id === internshipId ? { ...item, applied: true } : item))
    } catch (applyError) {
      setMessage(applyError instanceof Error ? applyError.message : 'Unable to submit application')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browse internships</CardTitle>
        <CardDescription>Search openings and apply in one click with your stored resume URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, company, location, or skill" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400" />
        </div>
        {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => {
            const descriptionSections = parseStructuredDescription(item.description)

            return (
              <div
                key={item.id}
                id={`internship-card-${item.id}`}
                className={`rounded-2xl border bg-slate-100/5 p-4 ${expandedCompanyId === item.id ? 'border-aurora-400/60 ring-1 ring-aurora-400/30' : 'border-slate-200/10'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.companies?.company_name ?? 'Incubated company'} · {item.location}</p>
                  </div>
                  <Badge variant="info">{item.internship_type}</Badge>
                </div>

                {descriptionSections.about ? <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-300">{descriptionSections.about}</p> : null}
                {descriptionSections.fallback ? <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-300">{descriptionSections.fallback}</p> : null}

                {descriptionSections.responsibilities.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Responsibilities</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      {descriptionSections.responsibilities.map((point) => <li key={point}>{point}</li>)}
                    </ol>
                  </div>
                ) : null}

                {descriptionSections.skills.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Skills required</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {descriptionSections.skills.map((skill) => <li key={skill}>{skill}</li>)}
                    </ul>
                  </div>
                ) : null}

                {descriptionSections.whoCanApply.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Who can apply</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      {descriptionSections.whoCanApply.map((point) => <li key={point}>{point}</li>)}
                    </ol>
                  </div>
                ) : null}

                {descriptionSections.requirements.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Other requirements</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      {descriptionSections.requirements.map((point) => <li key={point}>{point}</li>)}
                    </ol>
                  </div>
                ) : null}

                {descriptionSections.perks.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Perks</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {descriptionSections.perks.map((perk) => <li key={perk}>{perk}</li>)}
                    </ul>
                  </div>
                ) : null}

                {descriptionSections.fee.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Application fee</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {descriptionSections.fee.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                ) : null}

                {descriptionSections.additionalInfo.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200/10 bg-slate-900/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Additional information</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {descriptionSections.additionalInfo.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  <Badge variant="muted">{item.stipend}</Badge>
                  <Badge variant="muted">{item.openings} openings</Badge>
                  <Badge variant="muted">Deadline {item.deadline}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedCompanyId(expandedCompanyId === item.id ? null : item.id)}
                  >
                    {expandedCompanyId === item.id ? 'Hide company details' : 'View company details'}
                  </Button>
                  <Button size="sm" onClick={() => void applyToInternship(item.id)} disabled={busyId === item.id || item.applied === true}>
                    {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {item.applied ? 'Already applied' : 'Apply now'}
                  </Button>
                </div>
                {expandedCompanyId === item.id ? (
                  <div className="mt-4 space-y-2 rounded-2xl border border-slate-200/10 bg-slate-900/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Company details</p>
                    <p className="text-sm text-slate-200"><span className="font-semibold text-white">Name:</span> {item.companies?.company_name ?? 'Not provided'}</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-300">{item.companies?.description?.trim() || 'No company description available.'}</p>
                    {item.companies?.website ? (
                      <a href={item.companies.website} target="_blank" rel="noreferrer" className="inline-flex text-sm text-sky-300 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-200">
                        Visit company website
                      </a>
                    ) : (
                      <p className="text-sm text-slate-400">Website not provided.</p>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
          {filteredItems.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No internships match the current search.</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
