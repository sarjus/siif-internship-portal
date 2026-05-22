'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  companies?: { company_name?: string | null } | null
}

export function InternshipBrowser ({ resumeUrl }: { resumeUrl: string }) {
  const [items, setItems] = useState<Internship[]>([])
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/internships', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Unable to load internships')
        setItems(result.internships ?? [])
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load internships')
      })
  }, [])

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return items
    return items.filter((item) => [item.title, item.location, item.internship_type, item.skills_required.join(' '), item.companies?.company_name ?? ''].join(' ').toLowerCase().includes(value))
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
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to submit application')
      setMessage('Application submitted successfully.')
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
          {filteredItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.companies?.company_name ?? 'Incubated company'} · {item.location}</p>
                </div>
                <Badge variant="info">{item.internship_type}</Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-slate-300">{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                <Badge variant="muted">{item.stipend}</Badge>
                <Badge variant="muted">{item.openings} openings</Badge>
                <Badge variant="muted">Deadline {item.deadline}</Badge>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => void applyToInternship(item.id)} disabled={busyId === item.id}>
                  {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply now
                </Button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 px-4 py-6 text-sm text-slate-400">No internships match the current search.</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
