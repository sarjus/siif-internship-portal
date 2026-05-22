'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getResponseMessage, readJsonResponse } from '@/lib/request'
import type { UserRole } from '@/lib/types'

type Mode = 'login' | 'register' | 'forgot'

export function AuthForm ({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    role: 'student' as UserRole,
    company_name: '',
    website: ''
  })

  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  async function handleSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : mode === 'register' ? '/api/auth/register' : '/api/auth/forgot-password'
      const payload = isForgot
        ? { email: form.email }
        : isRegister
          ? form
          : { email: form.email, password: form.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await readJsonResponse<{ error?: string; message?: string; redirectTo?: string }>(response)

      if (!response.ok) {
        throw new Error(getResponseMessage(result, 'Something went wrong'))
      }

      if (mode === 'forgot') {
        setError(getResponseMessage(result, 'Reset request created. Check your email provider integration.'))
        return
      }

      if (mode === 'register') {
        router.push('/login?registered=1')
        return
      }

      window.location.href = typeof result.redirectTo === 'string' ? result.redirectTo : '/admin'
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit form')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset your password'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Sign in with your custom portal credentials.'
            : mode === 'register'
              ? 'Register manually. Company accounts await incubator approval.'
              : 'We will create a secure password reset request.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-200">Full name</label>
                <Input required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Email</label>
                <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@domain.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Phone</label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Role</label>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="h-11 w-full rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 text-sm text-white outline-none focus:border-aurora-400">
                  <option value="student">Student</option>
                  <option value="company">Company / Startup</option>
                </select>
              </div>
              {form.role === 'company' ? (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-200">Company name</label>
                    <Input required value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} placeholder="Startup / incubated company name" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-200">Website</label>
                    <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://your-company.com" />
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Password</label>
                <Input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Confirm password</label>
                <Input required type="password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} placeholder="Repeat password" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Email</label>
                <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@domain.com" />
              </div>
              {isForgot ? null : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <Input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your secure password" />
                </div>
              )}
            </div>
          )}

          {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            {mode === 'login' ? <Link href="/forgot-password" className="hover:text-sky-200">Forgot password?</Link> : <Link href="/login" className="hover:text-sky-200">Back to login</Link>}
            {mode === 'login' ? <Link href="/register" className="hover:text-sky-200">Create account</Link> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
