'use client'

import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

export function CompanyProfileForm ({ initialValues, companyId }: { initialValues: { company_name: string; description: string; website: string; logo: string }; companyId: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [form, setForm] = useState(initialValues)

  async function uploadLogo (): Promise<string | null> {
    if (!logoFile) return form.logo || null

    const uploadData = new FormData()
    uploadData.append('file', logoFile)
    uploadData.append('bucket', 'logos')
    uploadData.append('folder', `companies/${companyId}`)

    const response = await fetch('/api/uploads', { method: 'POST', body: uploadData })
    const result = await readJsonResponse<{ error?: string; message?: string; url?: string }>(response)

    if (!response.ok) {
      throw new Error(getResponseMessage(result, 'Unable to upload company logo'))
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
      const logoUrl = await uploadLogo()
      const response = await fetch('/api/company/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logo: logoUrl
        })
      })

      const result = await readJsonResponse<{ error?: string; message?: string }>(response)

      if (!response.ok) {
        throw new Error(getResponseMessage(result, 'Unable to update company profile'))
      }

      setMessage('Company profile updated successfully.')
      setLogoFile(null)
      if (logoUrl) setForm({ ...form, logo: logoUrl })
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Unable to update company profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
        <CardDescription>Update your startup identity and upload a logo into Supabase Storage.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input required placeholder="Company name" value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <Input placeholder="Website" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200/10 bg-slate-100/5 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <Upload className="h-4 w-4" />
              Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
            </label>
            <p className="text-xs text-slate-400">{logoFile ? logoFile.name : form.logo ? 'Current logo URL stored' : 'PNG, JPG, or SVG'}</p>
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
