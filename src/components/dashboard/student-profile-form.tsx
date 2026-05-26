'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

type FieldBlockProps = {
  label: string
  children: ReactNode
}

function FieldBlock ({ label, children }: FieldBlockProps) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      {children}
    </div>
  )
}

export function StudentProfileForm ({ initialValues, userId }: { initialValues: { college_name: string; programme: string; study_year: string; current_cgpa: string; back_papers: number; department: string; skills: string[]; resume_url: string; github: string; linkedin: string; portfolio: string; profile_image: string }; userId: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [skillsText, setSkillsText] = useState(initialValues.skills.join(', '))
  const [form, setForm] = useState({ ...initialValues })

  async function uploadFile (file: File, bucket: 'profiles' | 'resumes', folder: string): Promise<string> {
    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('bucket', bucket)
    uploadData.append('folder', folder)

    const response = await fetch('/api/uploads', { method: 'POST', body: uploadData })
    const result = await readJsonResponse<{ error?: string; message?: string; url?: string }>(response)

    if (!response.ok) {
      throw new Error(getResponseMessage(result, 'Unable to upload file'))
    }

    if (typeof result.url !== 'string' || !result.url) {
      throw new Error('Upload completed without a file URL')
    }

    return result.url
  }

  async function handleSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      const [resumeUrl, profileImageUrl] = await Promise.all([
        resumeFile ? uploadFile(resumeFile, 'resumes', `students/${userId}`) : Promise.resolve(form.resume_url || ''),
        profileImageFile ? uploadFile(profileImageFile, 'profiles', `students/${userId}`) : Promise.resolve(form.profile_image || '')
      ])

      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: skillsText.split(',').map((skill) => skill.trim()).filter(Boolean),
          resume_url: resumeUrl,
          profile_image: profileImageUrl
        })
      })

      const result = await readJsonResponse<{ error?: string; message?: string }>(response)

      if (!response.ok) {
        throw new Error(getResponseMessage(result, 'Unable to update student profile'))
      }

      setMessage('Student profile updated successfully.')
      setResumeFile(null)
      setProfileImageFile(null)
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Unable to update student profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student profile</CardTitle>
        <CardDescription>Maintain your academic profile, links, and upload a resume.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FieldBlock label="College name">
            <Input required placeholder="College name" value={form.college_name} onChange={(event) => setForm({ ...form, college_name: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Department">
            <Input required placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Programme">
            <Input required placeholder="Programme (e.g. B.Tech, MBA)" value={form.programme} onChange={(event) => setForm({ ...form, programme: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Study year">
            <Input required placeholder="Year of studying (e.g. 1st year)" value={form.study_year} onChange={(event) => setForm({ ...form, study_year: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Current CGPA">
            <Input required placeholder="Current CGPA (e.g. 6.2)" value={form.current_cgpa} onChange={(event) => setForm({ ...form, current_cgpa: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Back papers">
            <Input required type="number" min={0} placeholder="No. of back papers (e.g. 2)" value={String(form.back_papers)} onChange={(event) => setForm({ ...form, back_papers: Number(event.target.value || 0) })} />
          </FieldBlock>
          <FieldBlock label="Skills">
            <Textarea required placeholder="Skills, comma separated" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />
          </FieldBlock>
          <FieldBlock label="GitHub">
            <Input placeholder="GitHub" value={form.github} onChange={(event) => setForm({ ...form, github: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="LinkedIn">
            <Input placeholder="LinkedIn" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Portfolio">
            <Input placeholder="Portfolio" value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Uploads">
            <div className="space-y-2 rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <Upload className="h-4 w-4" />
              Upload profile image
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)} />
            </label>
              {form.profile_image ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Current profile photo:</p>
                  <a href={form.profile_image} target="_blank" rel="noreferrer" className="inline-block">
                    <img
                      src={form.profile_image}
                      alt="Current profile"
                      className="h-20 w-20 rounded-xl border border-slate-200/20 object-cover"
                    />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No profile photo uploaded yet.</p>
              )}
              {profileImageFile ? <p className="text-xs text-amber-300">New profile photo selected. Saving profile will replace the current photo.</p> : null}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <Upload className="h-4 w-4" />
              Upload resume
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
            </label>
              {form.resume_url ? (
                <p className="text-xs text-slate-300">
                  Current resume:{' '}
                  <a href={form.resume_url} target="_blank" rel="noreferrer" className="font-medium text-aurora-300 underline underline-offset-2 hover:text-aurora-200">
                    View uploaded resume
                  </a>
                </p>
              ) : (
                <p className="text-xs text-slate-400">No resume uploaded yet.</p>
              )}
              {resumeFile ? <p className="text-xs text-amber-300">New resume selected. Saving profile will replace the current resume.</p> : null}
            <p className="text-xs text-slate-400">{profileImageFile ? profileImageFile.name : 'Profile image optional'} · {resumeFile ? resumeFile.name : 'Resume optional'}</p>
            </div>
          </FieldBlock>
          {message ? <p className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
