import { NextResponse, type NextRequest } from 'next/server'
import { authRegisterSchema } from '@/lib/validators'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth/password'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function POST (request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = authRegisterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid registration payload' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const email = parsed.data.email.toLowerCase()

  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle()

  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const accountStatus = parsed.data.role === 'company' ? 'pending_approval' : 'active'

  const { data: user, error: userError } = await supabase.from('users').insert({
    full_name: parsed.data.full_name,
    email,
    password_hash: passwordHash,
    role: parsed.data.role,
    phone: parsed.data.phone || null,
    profile_image: null,
    account_status: accountStatus
  }).select('id, role, full_name, email').single()

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message ?? 'Unable to create user account' }, { status: 500 })
  }

  if (parsed.data.role === 'company') {
    const { error: companyError } = await supabase.from('companies').insert({
      user_id: user.id,
      company_name: parsed.data.company_name || parsed.data.full_name,
      description: '',
      website: parsed.data.website || null,
      logo: null,
      approved_status: false
    })

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 })
    }
  } else {
    const { error: studentError } = await supabase.from('student_profiles').insert({
      user_id: user.id,
      department: null,
      skills: [],
      resume_url: null,
      github: null,
      linkedin: null,
      portfolio: null
    })

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 })
    }
  }

  await logActivity({
    actorUserId: user.id,
    action: 'register',
    entityType: parsed.data.role,
    entityId: user.id,
    metadata: { account_status: accountStatus }
  })

  return NextResponse.json({
    message: parsed.data.role === 'company'
      ? 'Company registration submitted. Await incubator approval.'
      : 'Student account created successfully.'
  }, { status: 201 })
}
