'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
type SortKey = 'status' | 'applied_date' | 'current_cgpa'
type SortDirection = 'asc' | 'desc'

const pageSizeOptions = [5, 10, 20] as const

function parsePageNumber (value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed
}

function parsePageSize (value: string | null): (typeof pageSizeOptions)[number] {
  const parsed = Number.parseInt(value ?? '', 10)
  return pageSizeOptions.find((option) => option === parsed) ?? 10
}

function formatStatusLabel (status: string): string {
  const matched = statuses.find((item) => item.value === status)
  if (matched) return matched.label
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderTextValue (value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'Not provided'
  if (typeof value === 'number') return String(value)
  return value.trim() ? value : 'Not provided'
}

function getSelectableStatusValue (status: string): StatusValue {
  return statuses.some((item) => item.value === status) ? status as StatusValue : 'reviewing'
}

function getSortValue (item: ApplicationReviewItem, key: SortKey): number | string {
  if (key === 'applied_date') {
    return item.applicant.applied_date ? new Date(item.applicant.applied_date).getTime() : Number.NEGATIVE_INFINITY
  }

  if (key === 'current_cgpa') {
    const parsed = Number.parseFloat(item.applicant.current_cgpa)
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
  }

  return formatStatusLabel(item.status).toLowerCase()
}

export function ApplicationReviewBoard ({ items }: { items: ApplicationReviewItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusById, setStatusById] = useState<Record<string, StatusValue>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<StatusValue>('reviewing')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StatusValue>('all')
  const [sortKey, setSortKey] = useState<SortKey>('applied_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(() => parsePageSize(searchParams.get('pageSize')))
  const [page, setPage] = useState(() => parsePageNumber(searchParams.get('page'), 1))

  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()

  const filteredItems = items
    .filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }

      if (!normalizedSearchTerm) {
        return true
      }

      const searchableContent = [
        item.title,
        item.subtitle,
        item.applicant.name,
        item.applicant.email,
        item.applicant.phone,
        item.applicant.college_name,
        item.applicant.programme,
        item.applicant.study_year,
        item.applicant.current_cgpa,
        item.applicant.department,
        item.applicant.skills.join(' '),
        formatStatusLabel(item.status)
      ].join(' ').toLowerCase()

      return searchableContent.includes(normalizedSearchTerm)
    })
    .sort((left, right) => {
      const leftValue = getSortValue(left, sortKey)
      const rightValue = getSortValue(right, sortKey)

      if (leftValue === rightValue) return 0

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue
      }

      const comparison = String(leftValue).localeCompare(String(rightValue))
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStartIndex = (currentPage - 1) * pageSize
  const pageEndIndex = pageStartIndex + pageSize
  const paginatedItems = filteredItems.slice(pageStartIndex, pageEndIndex)
  const visibleIds = paginatedItems.map((item) => item.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  useEffect(() => {
    const allIds = new Set(filteredItems.map((item) => item.id))
    setSelectedIds((current) => current.filter((id) => allIds.has(id)))
  }, [filteredItems])

  useEffect(() => {
    const nextPage = parsePageNumber(searchParams.get('page'), 1)
    const nextPageSize = parsePageSize(searchParams.get('pageSize'))

    setPage((current) => current === nextPage ? current : nextPage)
    setPageSize((current) => current === nextPageSize ? current : nextPageSize)
  }, [searchParams])

  useEffect(() => {
    setPage(1)
  }, [normalizedSearchTerm, statusFilter, pageSize])

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage)
    }
  }, [page, currentPage])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(currentPage))
    params.set('pageSize', String(pageSize))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [currentPage, pageSize, pathname, router, searchParams])

  function toggleSort (key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(key)
    setSortDirection(key === 'status' ? 'asc' : 'desc')
  }

  function renderSortIcon (key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
  }

  function changePageSize (value: string) {
    setPageSize(Number(value) as (typeof pageSizeOptions)[number])
  }

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return [1]

    const windowStart = Math.max(2, currentPage - 1)
    const windowEnd = Math.min(totalPages - 1, currentPage + 1)
    const buttons: Array<number | 'left-ellipsis' | 'right-ellipsis'> = [1]

    if (windowStart > 2) {
      buttons.push('left-ellipsis')
    }

    for (let value = windowStart; value <= windowEnd; value += 1) {
      buttons.push(value)
    }

    if (windowEnd < totalPages - 1) {
      buttons.push('right-ellipsis')
    }

    if (totalPages > 1) {
      buttons.push(totalPages)
    }

    return buttons
  }, [currentPage, totalPages])

  function toggleSelection (applicationId: string) {
    setSelectedIds((current) => current.includes(applicationId) ? current.filter((id) => id !== applicationId) : [...current, applicationId])
  }

  function toggleAllSelections () {
    setSelectedIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id))
      }

      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  function escapeCsvValue (value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  function buildCsvContent (rowsToExport: ApplicationReviewItem[]): string {
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

    const rows = rowsToExport.map((item) => [
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
    if (filteredItems.length === 0) {
      setMessage('No applicant data available to export.')
      return
    }

    const csv = buildCsvContent(filteredItems)
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
        body: JSON.stringify({ status: statusById[applicationId] ?? getSelectableStatusValue(items.find((item) => item.id === applicationId)?.status ?? 'reviewing') })
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
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_auto]">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by applicant, internship, email, college, department, or skill"
              aria-label="Search applicants"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | StatusValue)} className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <div className="flex items-center text-sm text-slate-600">Showing {filteredItems.length} of {items.length} applicants</div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Use the table checkboxes to select visible applicants for bulk status updates.</p>
        </div>

        {filteredItems.length > 0 ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-600">
              <div>
                Showing {filteredItems.length === 0 ? 0 : pageStartIndex + 1} to {Math.min(pageEndIndex, filteredItems.length)} of {filteredItems.length} applicants
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select value={pageSize} onChange={(event) => changePageSize(event.target.value)} className="h-10 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                  {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1800px] divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allSelected} onChange={toggleAllSelections} aria-label="Select all applicants on this page" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                    </th>
                    <th className="px-4 py-3 font-semibold">Internship</th>
                    <th className="px-4 py-3 font-semibold">Applicant</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">College</th>
                    <th className="px-4 py-3 font-semibold">Programme</th>
                    <th className="px-4 py-3 font-semibold">Study year</th>
                    <th className="px-4 py-3 font-semibold">
                      <button type="button" onClick={() => toggleSort('current_cgpa')} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700">
                        CGPA
                        {renderSortIcon('current_cgpa')}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Back papers</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Skills</th>
                    <th className="px-4 py-3 font-semibold">Links</th>
                    <th className="px-4 py-3 font-semibold">
                      <button type="button" onClick={() => toggleSort('applied_date')} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700">
                        Applied on
                        {renderSortIcon('applied_date')}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700">
                        Current status
                        {renderSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Update status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 align-top">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          aria-label={`Select ${item.subtitle}`}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">{renderTextValue(item.title)}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{renderTextValue(item.applicant.name)}</div>
                        <div className="mt-1 text-xs text-slate-500">Application ID: {item.id}</div>
                      </td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.email)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.phone)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.college_name)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.programme)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.study_year)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.current_cgpa)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.back_papers)}</td>
                      <td className="px-4 py-4">{renderTextValue(item.applicant.department)}</td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs whitespace-normal">{item.applicant.skills.length > 0 ? item.applicant.skills.join(', ') : 'Not provided'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[8rem] flex-col gap-1">
                          {item.applicant.resume_url ? <a href={item.applicant.resume_url} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">Resume</a> : null}
                          {item.applicant.github ? <a href={item.applicant.github} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">GitHub</a> : null}
                          {item.applicant.linkedin ? <a href={item.applicant.linkedin} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">LinkedIn</a> : null}
                          {item.applicant.portfolio ? <a href={item.applicant.portfolio} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-800">Portfolio</a> : null}
                          {!item.applicant.resume_url && !item.applicant.github && !item.applicant.linkedin && !item.applicant.portfolio ? <span className="text-slate-500">Not provided</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">{item.applicant.applied_date ? new Date(item.applicant.applied_date).toLocaleDateString() : 'Not provided'}</td>
                      <td className="px-4 py-4"><Badge variant="muted">{formatStatusLabel(item.status)}</Badge></td>
                      <td className="px-4 py-4">
                        <select value={statusById[item.id] ?? getSelectableStatusValue(item.status)} onChange={(event) => setStatusById({ ...statusById, [item.id]: event.target.value as StatusValue })} className="h-10 min-w-[11rem] rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                          {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <Button size="sm" type="button" onClick={() => void updateStatus(item.id)} disabled={busyId === item.id}>
                          {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-600">
              <div>Page {currentPage} of {totalPages}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" type="button" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                {pageButtons.map((entry) => {
                  if (typeof entry !== 'number') {
                    return <span key={entry} className="px-1 text-slate-400">...</span>
                  }

                  return (
                    <Button key={entry} size="sm" type="button" variant={entry === currentPage ? undefined : 'outline'} onClick={() => setPage(entry)}>
                      {entry}
                    </Button>
                  )
                })}
                <Button size="sm" type="button" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 px-4 py-6 text-sm text-slate-500">No applications to review yet.</p> : null}
        {items.length > 0 && filteredItems.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 px-4 py-6 text-sm text-slate-500">No applicants match the current search or filter.</p> : null}
      </CardContent>
    </Card>
  )
}
