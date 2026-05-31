import nodemailer from 'nodemailer'

type EmailMessage = {
  to: string | string[]
  subject: string
  text: string
  html: string
}

type TransportConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  from: string
}

function readTransportConfig (): TransportConfig | null {
  const host = process.env.EMAIL_SMTP_HOST
  const port = Number(process.env.EMAIL_SMTP_PORT ?? '587')
  const user = process.env.EMAIL_SMTP_USER
  const password = process.env.EMAIL_SMTP_PASSWORD
  const from = process.env.EMAIL_FROM

  if (!host || !user || !password || !from || !Number.isFinite(port)) {
    return null
  }

  return {
    host,
    port,
    secure: process.env.EMAIL_SMTP_SECURE === 'true' || port === 465,
    user,
    password,
    from
  }
}

function createTransporter () {
  const config = readTransportConfig()

  if (!config) {
    return null
  }

  return {
    from: config.from,
    transport: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      }
    })
  }
}

function normalizeBaseUrl (value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return ''
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function isLocalhostUrl (url: string): boolean {
  return /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(url)
}

export function getAppBaseUrl (requestOrigin?: string): string {
  const isProduction = process.env.NODE_ENV === 'production'

  const candidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    requestOrigin
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const normalized = normalizeBaseUrl(candidate)

    if (!normalized) {
      continue
    }

    if (isProduction && isLocalhostUrl(normalized)) {
      continue
    }

    return normalized
  }

  return 'http://localhost:3000'
}

export function isEmailConfigured (): boolean {
  return createTransporter() !== null
}

export async function sendEmail (message: EmailMessage): Promise<boolean> {
  const transporter = createTransporter()

  if (!transporter) {
    return false
  }

  await transporter.transport.sendMail({
    from: transporter.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  })

  return true
}
