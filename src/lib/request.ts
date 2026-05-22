import type { NextRequest } from 'next/server'

export async function readRequestBody (request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return await request.json()
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries())
  }

  return Object.fromEntries((await request.formData()).entries())
}

export async function readJsonResponse<T extends Record<string, unknown> = Record<string, unknown>> (response: Response): Promise<T> {
  const body = await response.text()

  if (!body.trim()) {
    return {} as T
  }

  try {
    const parsed = JSON.parse(body)
    return (parsed && typeof parsed === 'object' ? parsed : {}) as T
  } catch {
    return {} as T
  }
}

export function getResponseMessage (payload: Record<string, unknown>, fallback: string): string {
  const errorMessage = payload.error
  if (typeof errorMessage === 'string' && errorMessage.trim()) {
    return errorMessage
  }

  const message = payload.message
  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return fallback
}
