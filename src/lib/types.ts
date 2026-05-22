export type UserRole = 'admin' | 'company' | 'student'

export type AccountStatus = 'pending_approval' | 'active' | 'suspended' | 'disabled'

export type InternshipType = 'full_time' | 'part_time' | 'remote' | 'hybrid'

export type AuthUser = {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone: string | null
  profile_image: string | null
  account_status: AccountStatus
  created_at: string
}

export type SessionUser = AuthUser & {
  company_name?: string | null
  department?: string | null
}

export type DashboardMetric = {
  label: string
  value: string
  delta?: string
  tone?: 'default' | 'success' | 'warning' | 'info'
}

export type DashboardListItem = {
  id: string
  title: string
  subtitle: string
  status: string
  meta?: string | null
}
