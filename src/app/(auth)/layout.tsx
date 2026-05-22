import { BrandMark } from '@/components/layout/brand-mark'

export default function AuthLayout ({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-dashboard-grid px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          <BrandMark />
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Custom access</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Secure manual login for the incubator ecosystem.</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Passwords are hashed with bcrypt, accounts are tracked in your own database tables, and sessions are managed on the server without Supabase Auth.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {['Bcrypt hashing', 'Role redirects', 'Approval-based onboarding'].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
