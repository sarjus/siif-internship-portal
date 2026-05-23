import { createHash, randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { uploadSchema } from '@/lib/validators'
import { requireSession } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type UploadBucket = 'resumes' | 'logos' | 'profiles' | 'brochures'

type BucketConfig = {
  public: boolean
  maxBytes: number
  allowedExtensions: string[]
  allowedMimeTypes: string[]
}

export const runtime = 'nodejs'

const storageBucketEnvMap: Record<UploadBucket, string | undefined> = {
  resumes: process.env.SUPABASE_STORAGE_BUCKET_RESUMES,
  logos: process.env.SUPABASE_STORAGE_BUCKET_LOGOS,
  profiles: process.env.SUPABASE_STORAGE_BUCKET_PROFILES,
  brochures: process.env.SUPABASE_STORAGE_BUCKET_BROCHURES
}

const bucketConfig: Record<UploadBucket, BucketConfig> = {
  resumes: {
    public: false,
    maxBytes: 5 * 1024 * 1024,
    allowedExtensions: ['pdf', 'doc', 'docx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  logos: {
    public: true,
    maxBytes: 3 * 1024 * 1024,
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  profiles: {
    public: true,
    maxBytes: 3 * 1024 * 1024,
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  brochures: {
    public: false,
    maxBytes: 10 * 1024 * 1024,
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf']
  }
}

function resolveBucketName (bucket: UploadBucket): string {
  return storageBucketEnvMap[bucket]?.trim() || bucket
}

function getBaseUrl (request: NextRequest): string {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
}

function getBucketAccessUrl (request: NextRequest, bucket: UploadBucket, path: string): string {
  return new URL(`/api/uploads?bucket=${bucket}&path=${encodeURIComponent(path)}`, getBaseUrl(request)).toString()
}

function validateFileUpload (file: File, bucket: UploadBucket): string | null {
  const config = bucketConfig[bucket]
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : ''

  if (!config.allowedExtensions.includes(extension)) {
    return `Unsupported file type for ${bucket}`
  }

  if (file.type && !config.allowedMimeTypes.includes(file.type)) {
    return `Unsupported MIME type for ${bucket}`
  }

  if (file.size > config.maxBytes) {
    return `File is too large for ${bucket}`
  }

  return null
}

async function ensureResumeAccess (path: string, userId: string, role: string): Promise<boolean> {
  const pathParts = path.split('/')
  const studentId = pathParts[0] === 'students' ? pathParts[1] : null

  if (!studentId) {
    return false
  }

  if (role === 'admin') {
    return true
  }

  if (role === 'student') {
    return studentId === userId
  }

  if (role !== 'company') {
    return false
  }

  const supabase = getSupabaseAdminClient()
  const { data: company } = await supabase.from('companies').select('id').eq('user_id', userId).maybeSingle()

  if (!company) {
    return false
  }

  const { data: application } = await supabase
    .from('applications')
    .select('id, internships(company_id)')
    .eq('student_id', studentId)

  return (application ?? []).some((row: { internships?: Array<{ company_id?: string | null }> | { company_id?: string | null } | null }) => {
    const internshipRow = Array.isArray(row.internships) ? row.internships[0] : row.internships
    return internshipRow?.company_id === company.id
  })
}

export async function GET (request: NextRequest) {
  const user = await requireSession()
  const bucket = request.nextUrl.searchParams.get('bucket') as UploadBucket | null
  const path = request.nextUrl.searchParams.get('path')

  if (!bucket || !(bucket in bucketConfig) || !path) {
    return NextResponse.json({ error: 'Invalid file request' }, { status: 400 })
  }

  if (bucket === 'resumes' || bucket === 'brochures') {
    const hasAccess = bucket === 'resumes'
      ? await ensureResumeAccess(path, user.id, user.role)
      : user.role === 'admin' || user.role === 'company'

    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this file' }, { status: 403 })
    }
  }

  const supabase = getSupabaseAdminClient()
  const bucketName = resolveBucketName(bucket)

  if (bucketConfig[bucket].public) {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
    return NextResponse.redirect(data.publicUrl)
  }

  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, 60 * 5)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Unable to access file' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

export async function POST (request: NextRequest) {
  await requireSession()

  const formData = await request.formData()
  const file = formData.get('file')
  const bucket = String(formData.get('bucket') ?? '')
  const folder = String(formData.get('folder') ?? '')
  const parsed = uploadSchema.safeParse({ bucket, folder })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid upload request' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A file is required' }, { status: 400 })
  }

  const validationError = validateFileUpload(file, parsed.data.bucket)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${randomUUID()}-${createHash('sha1').update(file.name).digest('hex')}`
  const path = [parsed.data.folder || folder || '', fileName].filter(Boolean).join('/')
  const bucketName = resolveBucketName(parsed.data.bucket)
  const config = bucketConfig[parsed.data.bucket]

  let { error } = await supabase.storage.from(bucketName).upload(path, fileBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false
  })

  if (error?.message?.toLowerCase().includes('bucket not found')) {
    const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
      public: config.public
    })

    if (!createBucketError) {
      const retryResult = await supabase.storage.from(bucketName).upload(path, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })
      error = retryResult.error
    }
  }

  if (error) {
    return NextResponse.json({ error: `Upload failed for bucket '${bucketName}': ${error.message}` }, { status: 500 })
  }

  const url = config.public
    ? supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl
    : getBucketAccessUrl(request, parsed.data.bucket, path)

  return NextResponse.json({
    url,
    bucket: bucketName,
    path
  })
}
