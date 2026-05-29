import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/guards'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity'
import { getAppBaseUrl, isEmailConfigured, sendEmail } from '@/lib/email'
import { incompleteProfileReminderSchema } from '@/lib/validators'
import { isIncompleteStudentProfile, type StudentProfileCompletionFields } from '@/lib/student-profile'

export const runtime = 'nodejs'

type StudentRow = {
  id: string
  full_name: string
  email: string
  student_profiles?: StudentProfileCompletionFields[] | StudentProfileCompletionFields | null
}

export async function POST (_request: NextRequest) {
  const body = await _request.json().catch(() => null)
  const parsed = incompleteProfileReminderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid reminder payload' }, { status: 400 })
  }

  const admin = await requireRole(['admin'])
  const supabase = getSupabaseAdminClient()

  const studentsResult = await supabase
    .from('users')
    .select('id, full_name, email, student_profiles(college_name, programme, study_year, current_cgpa, back_papers, department, skills)')
    .eq('role', 'student')
    .in('account_status', ['active', 'pending_approval'])

  if (studentsResult.error) {
    return NextResponse.json({ error: studentsResult.error.message }, { status: 500 })
  }

  const students = (studentsResult.data ?? []) as StudentRow[]
  const incompleteStudents = students.filter((student) => {
    const profile = Array.isArray(student.student_profiles)
      ? student.student_profiles[0] ?? null
      : student.student_profiles ?? null

    return isIncompleteStudentProfile(profile)
  })

  if (incompleteStudents.length === 0) {
    return NextResponse.json({ message: 'All student profiles are complete.', notified: 0, emailed: 0, emailConfigured: isEmailConfigured() })
  }

  const notificationTitle = parsed.data.notification_title
  const notificationBody = parsed.data.message
  const emailSubject = parsed.data.email_subject

  const notificationRows = incompleteStudents.map((student) => ({
    user_id: student.id,
    created_by_user_id: admin.id,
    title: notificationTitle,
    body: notificationBody
  }))

  const notificationResult = await supabase.from('notifications').insert(notificationRows).select('id')

  if (notificationResult.error) {
    return NextResponse.json({ error: notificationResult.error.message }, { status: 500 })
  }

  const profileLink = `${getAppBaseUrl()}/student/profile`
  const emailReady = isEmailConfigured()
  let emailedCount = 0

  if (emailReady) {
    for (const student of incompleteStudents) {
      try {
        const sent = await sendEmail({
          to: student.email,
          subject: emailSubject,
          text: `Hello ${student.full_name},\n\n${notificationBody}\n\nOpen your profile here: ${profileLink}\n\nRegards,\nSIIF Internship Portal`,
          html: `<p>Hello ${student.full_name},</p><p>${notificationBody.replace(/\n/g, '<br/>')}</p><p><a href="${profileLink}">Open your profile</a></p><p>Regards,<br/>SIIF Internship Portal</p>`
        })

        if (sent) {
          emailedCount += 1
        }
      } catch {
        // Continue sending to remaining users even if one email fails.
      }
    }
  }

  await logActivity({
    actorUserId: admin.id,
    action: 'create',
    entityType: 'notification',
    entityId: notificationResult.data?.[0]?.id ?? null,
    metadata: {
      type: 'incomplete_profile_reminder',
      recipients: notificationResult.data?.length ?? 0,
      emails_sent: emailedCount,
      email_configured: emailReady,
      notification_title: notificationTitle,
      email_subject: emailSubject
    }
  })

  return NextResponse.json({
    message: 'Reminder sent to students with incomplete profiles.',
    notified: notificationResult.data?.length ?? 0,
    emailed: emailedCount,
    emailConfigured: emailReady
  }, { status: 201 })
}
