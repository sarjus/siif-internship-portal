import { BrandMark } from '@/components/layout/brand-mark'

export default function AuthLayout ({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-dashboard-grid px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          <BrandMark />
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">SMART INTERNSHIP MANAGEMENTs</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Connecting students and startups through one unified platform.</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Manage internship opportunities, streamline applications, and track approvals with a secure portal designed for the SIIF innovation ecosystem.
            </p>
            <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-400">
              <li>Centralized internship listings from SIIF startups</li>
              <li>Streamlined application process for students</li>
              <li>Role-based access and approval workflows</li>
            </ul>
            
          </div>
          
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
