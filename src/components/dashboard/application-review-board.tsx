'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

type ApplicantDetails = {
  name: string
  email: string
  phone: string
  college_name: string
  programme: string
  study_year: string
  current_cgpa: string
  back_papers: number | null
  department: string
  skills: string[]
  github: string
  linkedin: string
  portfolio: string
  resume_url: string
  applied_date: string
}

type ApplicationReviewItem = {
  id: string
  title: string
  subtitle: string
  status: string
  meta?: string | null
  applicant: ApplicantDetails
}

const statuses = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'hired', label: 'Hired' }
] as const

type StatusValue = (typeof statuses)[number]['value']

function formatStatusLabel (status: string): string {
  const matched = statuses.find((item) => item.value === status)
  if (matched) return matched.label
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function ApplicationReviewBoard ({ items }: { items: ApplicationReviewItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusById, setStatusById] = useState<Record<string, StatusValue>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<StatusValue>('reviewing')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const allSelected = items.length > 0 && selectedIds.length === items.length

  function toggleSelection (applicationId: string) {
    setSelectedIds((current) => current.includes(applicationId) ? current.filter((id) => id !== applicationId) : [...current, applicationId])
  }

  function toggleAllSelections () {
    setSelectedIds((current) => current.length === items.length ? [] : items.map((item) => item.id))
  }

  function escapeCsvValue (value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  function buildCsvContent (): string {
    const headers = [
      'Application ID',
      'Internship Title',
      'Applicant Name',
      'Email',
      'Phone',
      'Status',
      'Applied Date',
      'College',
      'Programme',
      'Study Year',
      'Current CGPA',
      'Back Papers',
      'Department',
      'Skills',
      'Resume URL',
      'GitHub',
      'LinkedIn',
      'Portfolio'
    ]

    const rows = items.map((item) => [
      item.id,
      item.title,
      item.applicant.name,
      item.applicant.email,
      item.applicant.phone,
      item.status,
      item.applicant.applied_date,
      item.applicant.college_name,
      item.applicant.programme,
      item.applicant.study_year,
      item.applicant.current_cgpa,
      item.applicant.back_papers !== null ? String(item.applicant.back_papers) : '',
      item.applicant.department,
      item.applicant.skills.join(', '),
      item.applicant.resume_url,
      item.applicant.github,
      item.applicant.linkedin,
      item.applicant.portfolio
    ])

    return [headers, ...rows].map((row) => row.map((value) => escapeCsvValue(value ?? '')).join(',')).join('\n')
  }

  function downloadExcelCsv () {
    if (items.length === 0) {
      setMessage('No applicant data available to export.')
      return
    }

    const csv = buildCsvContent()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `applicants-${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function updateStatus (applicationId: string) {
    setBusyId(applicationId)
    setMessage(null)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusById[applicationId] ?? 'reviewing' })
      })
      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to update application'))
      setMessage('Application updated successfully.')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update application')
    } finally {
      setBusyId(null)
    }
  }

  async function updateSelectedStatuses () {
    if (selectedIds.length === 0) {
      setMessage('Select at least one applicant to update status.')
      return
    }

    setBulkBusy(true)
    setMessage(null)
    try {
      const responses = await Promise.all(selectedIds.map(async (applicationId) => {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus })
        })
        const result = await readJsonResponse<{ error?: string; message?: string }>(response)
        return { ok: response.ok, result }
      }))

      const failed = responses.filter((entry) => !entry.ok)
      if (failed.length > 0) {
        throw new Error(getResponseMessage(failed[0]?.result, 'Some selected applications could not be updated'))
      }

      setMessage(`Updated ${selectedIds.length} applicant(s) to ${formatStatusLabel(bulkStatus)}.`)
      setSelectedIds([])
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update selected applicants')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application review</CardTitle>
        <CardDescription>Shortlist, reject, and move candidates through the interview pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p> : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" type="button" variant="outline" onClick={downloadExcelCsv}>Download applicants (Excel CSV)</Button>
            <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as StatusValue)} className="h-10 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <Button size="sm" type="button" onClick={() => void updateSelectedStatuses()} disabled={bulkBusy || selectedIds.length === 0}>
              {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update selected
            </Button>
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allSelected} onChange={toggleAllSelections} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
              <span>Select all applicants</span>
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <label key={`select-${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-900">{item.subtitle}</span>
                  </div>
                  <span className="truncate text-slate-600">{item.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">Applicant: {item.subtitle}</p>
              </div>

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-2">
                <p><span className="font-semibold text-slate-900">Email:</span> {item.applicant.email || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Phone:</span> {item.applicant.phone || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">College:</span> {item.applicant.college_name || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Programme:</span> {item.applicant.programme || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Study year:</span> {item.applicant.study_year || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Current CGPA:</span> {item.applicant.current_cgpa || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Back papers:</span> {item.applicant.back_papers !== null ? item.applicant.back_papers : 'Not provided'}</p>
                <p><span className="font-semibold text-slate-900">Department:</span> {item.applicant.department || 'Not provided'}</p>
                <p className="md:col-span-2"><span className="font-semibold text-slate-900">Skills:</span> {item.applicant.skills.length > 0 ? item.applicant.skills.join(', ') : 'Not provided'}</p>
                <div className="md:col-span-2 flex flex-wrap gap-3 text-sm">
                  {item.applicant.resume_url ? <a href={item.applicant.resume_url} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">View resume</a> : null}
                  {item.applicant.github ? <a href={item.applicant.github} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">GitHub</a> : null}
                  {item.applicant.linkedin ? <a href={item.applicant.linkedin} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">LinkedIn</a> : null}
                  {item.applicant.portfolio ? <a href={item.applicant.portfolio} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">Portfolio</a> : null}
                </div>
                {item.applicant.applied_date ? <p className="md:col-span-2 text-xs text-slate-500">Applied on: {new Date(item.applicant.applied_date).toLocaleDateString()}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{formatStatusLabel(item.status)}</Badge>
                <select value={statusById[item.id] ?? 'reviewing'} onChange={(event) => setStatusById({ ...statusById, [item.id]: event.target.value as StatusValue })} className="h-10 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                  {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                <Button size="sm" type="button" onClick={() => void updateStatus(item.id)} disabled={busyId === item.id}>
                  {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 px-4 py-6 text-sm text-slate-500">No applications to review yet.</p> : null}
      </CardContent>
    </Card>
  )
}
