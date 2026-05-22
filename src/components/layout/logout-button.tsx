'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LogoutButton () {
  const [busy, setBusy] = useState(false)

  async function handleLogout () {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={busy}>
      {busy ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
