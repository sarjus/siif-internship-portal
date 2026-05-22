'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, PencilLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

export function InternshipManager ({ companyId, adminMode = false }: { companyId?: string; adminMode?: boolean }) {
  const [internships, setInternships] = useState<Internship[]>([])
  const [busy, setBusy] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const loadInternships = useCallback(async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/internships', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to load internships')
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
      description: selected.description,
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
      const response = await fetch(selectedId ? `/api/internships/${selectedId}` : '/api/internships', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills_required: form.skills_required.split(',').map((skill) => skill.trim()).filter(Boolean),
          openings: Number(form.openings)
        })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to save internship')
      setMessage(selectedId ? 'Internship updated.' : 'Internship created.')
      setSelectedId(null)
      setForm({
        title: '',
        description: '',
        duration: '12 weeks',
        stipend: 'Paid',
        skills_required: 'React, TypeScript',
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
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to delete internship')
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
        <CardDescription>Publish, update, and remove opportunities from the incubator network.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitInternship}>
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
