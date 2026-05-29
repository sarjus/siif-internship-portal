'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getResponseMessage, readJsonResponse } from '@/lib/request'
import { isIncompleteStudentProfile } from '@/lib/student-profile'

type StudentRegistration = {
  id: string
  full_name: string
  email: string
  phone: string | null
  account_status: 'pending_approval' | 'active' | 'suspended' | 'disabled'
  created_at: string
  college_name: string | null
  programme: string | null
  study_year: string | null
  current_cgpa: string | null
  back_papers: number | null
  department: string | null
  skills: string[]
  resume_url: string | null
  github: string | null
  linkedin: string | null
  portfolio: string | null
}

type RegistrationDraft = {
  full_name: string
  email: string
  phone: string
  account_status: 'pending_approval' | 'active' | 'suspended' | 'disabled'
  college_name: string
  programme: string
  study_year: string
  current_cgpa: string
  back_papers: string
  department: string
  skillsText: string
  resume_url: string
  github: string
  linkedin: string
  portfolio: string
}

const accountStatuses = ['pending_approval', 'active', 'suspended', 'disabled'] as const
const completionFilters = ['all', 'incomplete', 'complete'] as const

function toDraft (student: StudentRegistration): RegistrationDraft {
  return {
    full_name: student.full_name,
    email: student.email,
    phone: student.phone ?? '',
    account_status: student.account_status,
    college_name: student.college_name ?? '',
    programme: student.programme ?? '',
    study_year: student.study_year ?? '',
    current_cgpa: student.current_cgpa ?? '',
    back_papers: String(student.back_papers ?? 0),
    department: student.department ?? '',
    skillsText: student.skills.join(', '),
    resume_url: student.resume_url ?? '',
    github: student.github ?? '',
    linkedin: student.linkedin ?? '',
    portfolio: student.portfolio ?? ''
  }
}

function normalizeSkills (skillsText: string): string[] {
  return skillsText.split(',').map((skill) => skill.trim()).filter(Boolean)
}

function isIncompleteDraft (draft: RegistrationDraft): boolean {
  return isIncompleteStudentProfile({
    college_name: draft.college_name,
    programme: draft.programme,
    study_year: draft.study_year,
    current_cgpa: draft.current_cgpa,
    back_papers: Number.parseInt(draft.back_papers || '0', 10),
    department: draft.department,
    skills: normalizeSkills(draft.skillsText)
  })
}

function statusVariant (status: StudentRegistration['account_status']): 'success' | 'warning' | 'muted' {
  if (status === 'active') return 'success'
  if (status === 'pending_approval') return 'warning'
  return 'muted'
}

function getPageSizeForWidth (width: number): number {
  if (width < 768) return 5
  if (width < 1280) return 8
  return 10
}

export function StudentRegistrationPanel ({
  students,
  initialCompletionFilter = 'all'
}: {
  students: StudentRegistration[]
  initialCompletionFilter?: typeof completionFilters[number]
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StudentRegistration['account_status']>('all')
  const [completionFilter, setCompletionFilter] = useState<typeof completionFilters[number]>(initialCompletionFilter)
  const [busyUpdateId, setBusyUpdateId] = useState<string | null>(null)
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(students[0]?.id ?? null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [message, setMessage] = useState<string | null>(null)
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [draftById, setDraftById] = useState<Record<string, RegistrationDraft>>(() => (
    students.reduce<Record<string, RegistrationDraft>>((acc, student) => {
      acc[student.id] = toDraft(student)
      return acc
    }, {})
  ))

  const visibleStudents = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase()

    return students.filter((student) => {
      if (removedIds.has(student.id)) return false
      if (statusFilter !== 'all' && student.account_status !== statusFilter) return false

      const draft = draftById[student.id] ?? toDraft(student)
      const isIncomplete = isIncompleteDraft(draft)

      if (completionFilter === 'incomplete' && !isIncomplete) return false
      if (completionFilter === 'complete' && isIncomplete) return false

      if (!loweredQuery) return true

      const searchable = [
        draft.full_name,
        draft.email,
        draft.college_name,
        draft.programme,
        draft.department
      ].join(' ').toLowerCase()

      return searchable.includes(loweredQuery)
    })
  }, [completionFilter, draftById, query, removedIds, statusFilter, students])

  useEffect(() => {
    const syncPageSize = () => setPageSize(getPageSizeForWidth(window.innerWidth))
    syncPageSize()
    window.addEventListener('resize', syncPageSize)
    return () => window.removeEventListener('resize', syncPageSize)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [completionFilter, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / pageSize))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return visibleStudents.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, visibleStudents])

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudentId(paginatedStudents[0]?.id ?? null)
      return
    }

    const stillVisible = visibleStudents.some((student) => student.id === selectedStudentId)
    if (!stillVisible) {
      setSelectedStudentId(paginatedStudents[0]?.id ?? null)
      setIsDetailsOpen(false)
    }
  }, [paginatedStudents, selectedStudentId, visibleStudents])

  const selectedStudent = useMemo(
    () => visibleStudents.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, visibleStudents]
  )

  function openDetails (studentId: string) {
    setSelectedStudentId(studentId)
    setIsDetailsOpen(true)
    window.requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function updateStudent (studentId: string) {
    const draft = draftById[studentId]
    if (!draft) return

    setBusyUpdateId(studentId)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: draft.full_name,
          email: draft.email,
          phone: draft.phone,
          account_status: draft.account_status,
          college_name: draft.college_name,
          programme: draft.programme,
          study_year: draft.study_year,
          current_cgpa: draft.current_cgpa,
          back_papers: Number.parseInt(draft.back_papers || '0', 10) || 0,
          department: draft.department,
          skills: normalizeSkills(draft.skillsText),
          resume_url: draft.resume_url,
          github: draft.github,
          linkedin: draft.linkedin,
          portfolio: draft.portfolio
        })
      })

      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to update student registration'))
      setMessage('Student registration updated successfully.')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Unable to update student registration')
    } finally {
      setBusyUpdateId(null)
    }
  }

  async function deleteStudent (studentId: string, fullName: string) {
    if (!window.confirm(`Delete registration for ${fullName}? This action cannot be undone.`)) {
      return
    }

    setBusyDeleteId(studentId)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE' })
      const result = await readJsonResponse<{ error?: string; message?: string }>(response)
      if (!response.ok) throw new Error(getResponseMessage(result, 'Unable to delete student registration'))

      setRemovedIds((current) => {
        const next = new Set(current)
        next.add(studentId)
        return next
      })
      setMessage('Student registration deleted successfully.')
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : 'Unable to delete student registration')
    } finally {
      setBusyDeleteId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student registrations</CardTitle>
        <CardDescription>Manage onboarding, profile data, account status, and registration records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p> : null}

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, college, programme, or department"
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | StudentRegistration['account_status'])}
            className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none"
          >
            <option value="all">All statuses</option>
            {accountStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select
            value={completionFilter}
            onChange={(event) => setCompletionFilter(event.target.value as typeof completionFilters[number])}
            className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none"
          >
            <option value="all">All profiles</option>
            <option value="incomplete">Incomplete profiles</option>
            <option value="complete">Complete profiles</option>
          </select>
        </div>

        {visibleStudents.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[920px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Student</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">College</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Programme</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Registered</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedStudents.map((student) => {
                  const draft = draftById[student.id] ?? toDraft(student)
                  const isSelected = selectedStudent?.id === student.id && isDetailsOpen
                  const isIncomplete = isIncompleteDraft(draft)

                  return (
                    <tr key={student.id} className={isSelected ? 'bg-sky-50/60' : ''}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{draft.full_name || student.full_name}</p>
                          <p className="text-xs text-slate-500">{draft.department || 'Department not set'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{draft.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-700">{draft.college_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-700">{draft.programme || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={statusVariant(draft.account_status)}>{draft.account_status}</Badge>
                          <Badge variant={isIncomplete ? 'warning' : 'success'}>{isIncomplete ? 'incomplete' : 'complete'}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{new Date(student.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() => openDetails(student.id)}
                        >
                          View details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {visibleStudents.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, visibleStudents.length)} of {visibleStudents.length} students
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>
                Previous
              </Button>
              <span className="px-2 text-sm text-slate-700">Page {currentPage} / {totalPages}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {selectedStudent && isDetailsOpen ? (() => {
          const draft = draftById[selectedStudent.id] ?? toDraft(selectedStudent)
          const isBusy = busyUpdateId === selectedStudent.id || busyDeleteId === selectedStudent.id

          return (
            <div ref={detailsRef} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Details: {draft.full_name || selectedStudent.full_name}</p>
                  <p className="text-sm text-slate-600">Update profile and registration information.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                  <Badge variant="info">student</Badge>
                  <Badge variant={statusVariant(draft.account_status)}>{draft.account_status}</Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Input value={draft.full_name} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, full_name: event.target.value } })} placeholder="Full name" />
                <Input value={draft.email} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, email: event.target.value } })} placeholder="Email" />
                <Input value={draft.phone} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, phone: event.target.value } })} placeholder="Phone" />
                <Input value={draft.college_name} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, college_name: event.target.value } })} placeholder="College" />
                <Input value={draft.programme} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, programme: event.target.value } })} placeholder="Programme" />
                <Input value={draft.study_year} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, study_year: event.target.value } })} placeholder="Study year" />
                <Input value={draft.department} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, department: event.target.value } })} placeholder="Department" />
                <Input value={draft.current_cgpa} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, current_cgpa: event.target.value } })} placeholder="Current CGPA" />
                <Input value={draft.back_papers} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, back_papers: event.target.value } })} placeholder="Back papers" inputMode="numeric" />
                <Input value={draft.skillsText} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, skillsText: event.target.value } })} placeholder="Skills (comma-separated)" className="md:col-span-2 xl:col-span-3" />
                <Input value={draft.resume_url} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, resume_url: event.target.value } })} placeholder="Resume URL" className="md:col-span-2 xl:col-span-3" />
                <Input value={draft.github} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, github: event.target.value } })} placeholder="GitHub URL" />
                <Input value={draft.linkedin} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, linkedin: event.target.value } })} placeholder="LinkedIn URL" />
                <Input value={draft.portfolio} onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, portfolio: event.target.value } })} placeholder="Portfolio URL" />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <select
                  value={draft.account_status}
                  onChange={(event) => setDraftById({ ...draftById, [selectedStudent.id]: { ...draft, account_status: event.target.value as StudentRegistration['account_status'] } })}
                  className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none"
                >
                  {accountStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void updateStudent(selectedStudent.id)} disabled={isBusy}>
                    {busyUpdateId === selectedStudent.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void deleteStudent(selectedStudent.id, draft.full_name || selectedStudent.full_name)}
                    disabled={isBusy}
                  >
                    {busyDeleteId === selectedStudent.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                    Delete registration
                  </Button>
                </div>
              </div>
            </div>
          )
        })() : null}

        {visibleStudents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            No student registrations match the current filters.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
