import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage ({ searchParams }: { searchParams?: { token?: string } }) {
  return <ResetPasswordForm token={searchParams?.token ?? ''} />
}
