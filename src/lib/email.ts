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

export function getAppBaseUrl (): string {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
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
