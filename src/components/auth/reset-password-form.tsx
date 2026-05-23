'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getResponseMessage, readJsonResponse } from '@/lib/request'

export function ResetPasswordForm ({ token }: { token: string }) {
  const router = useRouter()
  const [checkingToken, setCheckingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ password: '', confirm_password: '' })

  useEffect(() => {
    if (!token) {
      setCheckingToken(false)
      setTokenValid(false)
      setError('This reset link is missing a token. Please request a new password reset email.')
      return
    }

    let cancelled = false

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        const result = await readJsonResponse<{ error?: string }>(response)

        if (!response.ok) {
          throw new Error(getResponseMessage(result, 'Reset link is invalid or has expired'))
        }

        if (!cancelled) {
          setTokenValid(true)
          setError(null)
        }
      } catch (verifyError) {
        if (!cancelled) {
          setTokenValid(false)
          setError(verifyError instanceof Error ? verifyError.message : 'Reset link is invalid or has expired')
        }
      } finally {
        if (!cancelled) {
          setCheckingToken(false)
        }
      }
    }

    void verifyToken()

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form })
      })

      const result = await readJsonResponse<{ error?: string; message?: string }>(response)

      if (!response.ok) {
        throw new Error(getResponseMessage(result, 'Unable to reset password'))
      }

      setMessage(getResponseMessage(result, 'Password updated successfully'))
      setTimeout(() => {
        router.push('/login?reset=1')
      }, 1200)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Choose a new password for your SIIF portal account.</CardDescription>
      </CardHeader>
      <CardContent>
        {checkingToken ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-8 text-sm text-slate-300">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying reset link...
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">New password</label>
            <Input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" disabled={checkingToken || !tokenValid} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Confirm password</label>
            <Input required type="password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} placeholder="Repeat password" disabled={checkingToken || !tokenValid} />
          </div>

          {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={busy || checkingToken || !tokenValid}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
