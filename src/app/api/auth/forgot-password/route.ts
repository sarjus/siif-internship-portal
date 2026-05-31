import { NextResponse, type NextRequest } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { addHours } from 'date-fns'
import { forgotPasswordSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAppBaseUrl, isEmailConfigured, sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST (request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = forgotPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: user } = await supabase.from('users').select('id').eq('email', parsed.data.email.toLowerCase()).maybeSingle()

  if (!user) {
    return NextResponse.json({ message: 'If the email exists, a reset request has been created.' })
  }

  const token = randomBytes(24).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { error } = await supabase.from('password_resets').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: addHours(new Date(), 2).toISOString(),
    consumed_at: null
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resetUrl = `${getAppBaseUrl(request.nextUrl.origin)}/reset-password?token=${token}`

  const emailSent = await sendEmail({
    to: parsed.data.email.toLowerCase(),
    subject: 'Reset your SIIF portal password',
    text: `We received a request to reset your password. Use this link to continue: ${resetUrl}\n\nThis link expires in 2 hours. If you did not request this, ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 2 hours. If you did not request this, you can ignore this email.</p>`
  })

  if (!emailSent && !isEmailConfigured()) {
    return NextResponse.json({
      message: 'Password reset request created, but email is not configured.',
      reset_token_preview: process.env.NODE_ENV === 'development' ? token : undefined,
      reset_url_preview: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Password reset email sent successfully.',
    reset_token_preview: process.env.NODE_ENV === 'development' ? token : undefined,
    reset_url_preview: process.env.NODE_ENV === 'development' ? resetUrl : undefined
  })
}
