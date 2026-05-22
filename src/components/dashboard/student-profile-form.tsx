'use client'

import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function StudentProfileForm ({ initialValues, userId }: { initialValues: { department: string; skills: string[]; resume_url: string; github: string; linkedin: string; portfolio: string; profile_image: string }; userId: string }) {
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
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error ?? 'Unable to upload file')
    }

    return result.url as string
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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to update student profile')
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
          <Input required placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <Textarea required placeholder="Skills, comma separated" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />
          <Input placeholder="GitHub" value={form.github} onChange={(event) => setForm({ ...form, github: event.target.value })} />
          <Input placeholder="LinkedIn" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} />
          <Input placeholder="Portfolio" value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} />
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <Upload className="h-4 w-4" />
              Upload profile image
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)} />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <Upload className="h-4 w-4" />
              Upload resume
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
            </label>
            <p className="text-xs text-slate-400">{profileImageFile ? profileImageFile.name : 'Profile image optional'} · {resumeFile ? resumeFile.name : 'Resume optional'}</p>
          </div>
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
