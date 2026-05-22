import { format } from 'date-fns'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { DashboardListItem, DashboardMetric, SessionUser } from '@/lib/types'

type DashboardData = {
  metrics: DashboardMetric[]
  highlights: DashboardListItem[]
  recent: DashboardListItem[]
  notifications: DashboardListItem[]
  insights: DashboardListItem[]
  activities: DashboardListItem[]
}

type CompanyRow = {
  id: string
  company_name: string | null
  approved_status: boolean
  website: string | null
  users?: {
    full_name?: string | null
    email?: string | null
  } | null
}

type ApplicationRow = {
  id: string
  status: string
  applied_date: string | null
  student_id: string
  internship_id: string
  internships?: {
    title?: string | null
  } | null
}

type InternshipRow = {
  id: string
  title: string
  deadline: string | null
  location: string
  internship_type: string
  openings: number
  stipend: string
}

type SimpleCountResult = {
  count: number | null
}

function emptyDashboard (): DashboardData {
  return {
    metrics: [],
    highlights: [],
    recent: [],
    notifications: [],
    insights: [],
    activities: []
  }
}

type NotificationRow = {
  id: string
  title: string
  body: string
  created_at: string
  read_at: string | null
}

type ActivityRow = {
  id: string
  action: string
  entity_type: string
  created_at: string
  metadata: Record<string, unknown> | null
}

async function safeCount (query: PromiseLike<SimpleCountResult>): Promise<number> {
  const result = await query
  return result?.count ?? 0
}

export async function getAdminDashboardData (): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient()

  try {
    const [usersCount, pendingCompaniesCount, internshipsCount, applicationsCount, companiesResult, applicationsResult] = await Promise.all([
      safeCount(supabase.from('users').select('*', { count: 'exact', head: true })),
      safeCount(supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'company').eq('account_status', 'pending_approval')),
      safeCount(supabase.from('internships').select('*', { count: 'exact', head: true })),
      safeCount(supabase.from('applications').select('*', { count: 'exact', head: true })),
      supabase
        .from('companies')
        .select('id, company_name, approved_status, website, users(full_name, email)')
        .order('approved_status', { ascending: true })
        .limit(5),
      supabase
        .from('applications')
        .select('id, status, applied_date, internships(title), student_id, internship_id')
        .order('applied_date', { ascending: false })
        .limit(5)
    ])

    const activitiesResult = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(6)

    const applicationStatusResult = await supabase.from('applications').select('status')
    const applicationStatuses = (applicationStatusResult.data ?? []).map((row: { status?: string | null }) => row.status ?? 'submitted')
    const applicationStatusCounts = applicationStatuses.reduce<Record<string, number>>((counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    }, {})

    const companyRows = (companiesResult.data ?? []) as CompanyRow[]
    const applicationRows = (applicationsResult.data ?? []) as ApplicationRow[]
    const activityRows = (activitiesResult.data ?? []) as ActivityRow[]

    return {
      metrics: [
        { label: 'Total Users', value: usersCount.toString(), delta: 'All roles' },
        { label: 'Companies Pending', value: pendingCompaniesCount.toString(), tone: 'warning' },
        { label: 'Active Internships', value: internshipsCount.toString(), tone: 'info' },
        { label: 'Applications', value: applicationsCount.toString(), tone: 'success' }
      ],
      highlights: companyRows.map((row) => ({
        id: row.id,
        title: row.company_name ?? 'Company',
        subtitle: row.users?.full_name ?? row.users?.email ?? 'Company account',
        status: row.approved_status ? 'approved' : 'pending',
        meta: row.website ?? ''
      })),
      recent: applicationRows.map((row) => ({
        id: row.id,
        title: row.internships?.title ?? 'Application',
        subtitle: `Student ${row.student_id}`,
        status: row.status,
        meta: row.applied_date ? format(new Date(row.applied_date), 'dd MMM yyyy') : ''
      })),
      notifications: [],
      insights: [
        { id: 'insight-1', title: 'Pending approvals', subtitle: 'Company registrations awaiting review', status: String(pendingCompaniesCount), meta: 'Live queue' },
        { id: 'insight-2', title: 'Submitted applications', subtitle: 'Application activity by status', status: String(applicationStatusCounts.submitted ?? 0), meta: 'submitted' },
        { id: 'insight-3', title: 'In review', subtitle: 'Applications currently being screened', status: String(applicationStatusCounts.reviewing ?? 0), meta: 'reviewing' },
        { id: 'insight-4', title: 'Shortlisted', subtitle: 'Candidates moved forward', status: String(applicationStatusCounts.shortlisted ?? 0), meta: 'shortlisted' }
      ],
      activities: activityRows.map((row) => ({
        id: row.id,
        title: row.action,
        subtitle: row.entity_type,
        status: row.created_at,
        meta: row.metadata ? JSON.stringify(row.metadata) : ''
      }))
    }
  } catch {
    return emptyDashboard()
  }
}

export async function getCompanyDashboardData (user: SessionUser): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient()

  try {
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).maybeSingle()
    const companyId = company?.id

    const [internshipsCount, applicationsCount, internshipsResult, applicationsResult] = await Promise.all([
      safeCount(supabase.from('internships').select('*', { count: 'exact', head: true }).eq('company_id', companyId ?? '')),
      safeCount(supabase.from('applications').select('*', { count: 'exact', head: true })),
      supabase.from('internships').select('id, title, deadline, location, internship_type, openings').eq('company_id', companyId ?? '').order('created_at', { ascending: false }).limit(6),
      supabase.from('applications').select('id, status, applied_date, student_id, internship_id, internships(title)').order('applied_date', { ascending: false }).limit(6)
    ])

    const notificationsResult = await supabase
      .from('notifications')
      .select('id, title, body, created_at, read_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const activitiesResult = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, metadata')
      .eq('actor_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const internships = (internshipsResult.data ?? []) as InternshipRow[]
    const applications = (applicationsResult.data ?? []) as ApplicationRow[]
    const notifications = (notificationsResult.data ?? []) as NotificationRow[]
    const activityRows = (activitiesResult.data ?? []) as ActivityRow[]

    return {
      metrics: [
        { label: 'Open Roles', value: internshipsCount.toString(), tone: 'info' },
        { label: 'Total Applications', value: applicationsCount.toString(), tone: 'success' },
        { label: 'Shortlisted', value: String(applications.filter((row) => row.status === 'shortlisted').length), tone: 'warning' },
        { label: 'Company Status', value: user.account_status.replace('_', ' ') }
      ],
      highlights: internships.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: `${row.location} · ${row.internship_type}`,
        status: `${row.openings} openings`,
        meta: row.deadline
      })),
      recent: applications.map((row) => ({
        id: row.id,
        title: row.internships?.title ?? 'Internship',
        subtitle: `Student ${row.student_id}`,
        status: row.status,
        meta: row.applied_date ? format(new Date(row.applied_date), 'dd MMM yyyy') : ''
      })),
      notifications: notifications.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.body,
        status: row.read_at ? 'read' : 'unread',
        meta: row.created_at
      })),
      insights: [],
      activities: activityRows.map((row) => ({
        id: row.id,
        title: row.action,
        subtitle: row.entity_type,
        status: row.created_at,
        meta: row.metadata ? JSON.stringify(row.metadata) : ''
      }))
    }
  } catch {
    return emptyDashboard()
  }
}

export async function getStudentDashboardData (user: SessionUser): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient()

  try {
    const [applicationsCount, internshipsCount, applicationsResult, internshipsResult] = await Promise.all([
      safeCount(supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id)),
      safeCount(supabase.from('internships').select('*', { count: 'exact', head: true })),
      supabase.from('applications').select('id, status, applied_date, internships(title), internship_id, student_id').eq('student_id', user.id).order('applied_date', { ascending: false }).limit(6),
      supabase.from('internships').select('id, title, company_id, stipend, deadline, location, internship_type, openings').order('created_at', { ascending: false }).limit(6)
    ])

    const notificationsResult = await supabase
      .from('notifications')
      .select('id, title, body, created_at, read_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const activitiesResult = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, metadata')
      .eq('actor_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const applications = (applicationsResult.data ?? []) as ApplicationRow[]
    const internships = (internshipsResult.data ?? []) as InternshipRow[]
    const notifications = (notificationsResult.data ?? []) as NotificationRow[]
    const activityRows = (activitiesResult.data ?? []) as ActivityRow[]

    return {
      metrics: [
        { label: 'Applications', value: applicationsCount.toString(), tone: 'success' },
        { label: 'Available Internships', value: internshipsCount.toString(), tone: 'info' },
        { label: 'Profile Status', value: user.account_status.replace('_', ' ') },
        { label: 'Ready Roles', value: String(internships.filter((row) => row.deadline).length) }
      ],
      highlights: applications.map((row) => ({
        id: row.id,
        title: row.internships?.title ?? 'Application',
        subtitle: `Applied on ${row.applied_date ? format(new Date(row.applied_date), 'dd MMM yyyy') : 'recently'}`,
        status: row.status,
        meta: row.internship_id
      })),
      recent: internships.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: `${row.location} · ${row.internship_type}`,
        status: row.stipend,
        meta: row.deadline
      })),
      notifications: notifications.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.body,
        status: row.read_at ? 'read' : 'unread',
        meta: row.created_at
      })),
      insights: [],
      activities: activityRows.map((row) => ({
        id: row.id,
        title: row.action,
        subtitle: row.entity_type,
        status: row.created_at,
        meta: row.metadata ? JSON.stringify(row.metadata) : ''
      }))
    }
  } catch {
    return emptyDashboard()
  }
}

export async function getCompanyNotifications (user: SessionUser): Promise<DashboardListItem[]> {
  const supabase = getSupabaseAdminClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, created_at, read_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (notifications ?? []).map((row: NotificationRow) => ({
    id: row.id,
    title: row.title,
    subtitle: row.body,
    status: row.read_at ? 'read' : 'unread',
    meta: row.created_at
  }))
}
