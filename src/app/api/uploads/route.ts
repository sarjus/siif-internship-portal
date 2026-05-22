import { createHash, randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { uploadSchema } from '@/lib/validators'
import { requireSession } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const storageBucketEnvMap: Record<'resumes' | 'logos' | 'profiles' | 'brochures', string | undefined> = {
  resumes: process.env.SUPABASE_STORAGE_BUCKET_RESUMES,
  logos: process.env.SUPABASE_STORAGE_BUCKET_LOGOS,
  profiles: process.env.SUPABASE_STORAGE_BUCKET_PROFILES,
  brochures: process.env.SUPABASE_STORAGE_BUCKET_BROCHURES
}

function resolveBucketName (bucket: 'resumes' | 'logos' | 'profiles' | 'brochures'): string {
  return storageBucketEnvMap[bucket]?.trim() || bucket
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

  const supabase = getSupabaseAdminClient()
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${randomUUID()}-${createHash('sha1').update(file.name).digest('hex')}`
  const path = [parsed.data.folder || folder || '', fileName].filter(Boolean).join('/')
  const bucketName = resolveBucketName(parsed.data.bucket)

  let { error } = await supabase.storage.from(bucketName).upload(path, fileBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false
  })

  if (error?.message?.toLowerCase().includes('bucket not found')) {
    const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
      public: true
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

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path)

  return NextResponse.json({
    url: data.publicUrl,
    bucket: bucketName,
    path
  })
}
