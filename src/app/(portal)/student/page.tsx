import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListPanel } from '@/components/dashboard/list-panel'
import { StudentProfileForm } from '@/components/dashboard/student-profile-form'
import { InternshipBrowser } from '@/components/dashboard/internship-browser'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { getStudentDashboardData } from '@/lib/dashboard'
import { requireRole } from '@/lib/auth/guards'

export default async function StudentDashboardPage () {
  const user = await requireRole(['student'])
  const supabase = getSupabaseAdminClient()
  const [data, profileResult] = await Promise.all([
    getStudentDashboardData(user),
    supabase.from('student_profiles').select('department, skills, resume_url, github, linkedin, portfolio').eq('user_id', user.id).maybeSingle()
  ])

  const profile = profileResult.data ?? {
    department: '',
    skills: [],
    resume_url: '',
    github: '',
    linkedin: '',
    portfolio: ''
  }

  return (
    <div id="overview" className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section id="profile" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <StudentProfileForm
          userId={user.id}
          initialValues={{
            department: profile.department ?? '',
            skills: profile.skills ?? [],
            resume_url: profile.resume_url ?? '',
            github: profile.github ?? '',
            linkedin: profile.linkedin ?? '',
            portfolio: profile.portfolio ?? '',
            profile_image: ''
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Student quick actions</CardTitle>
            <CardDescription>Everything needed to prepare for internship applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {[
              'Upload a resume into the resumes bucket',
              'Search and apply to live internships',
              'Track application status as it changes',
              'Store GitHub, LinkedIn, and portfolio links'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
      </section>

      <section id="applications">
        <ListPanel title="Application status" description="Track every submission from your dashboard." items={data.highlights} />
      </section>

      <section id="browse">
        <InternshipBrowser resumeUrl={profile.resume_url ?? ''} />
      </section>

      <section id="notifications">
        <ListPanel title="Notifications" description="Updates from the incubator and application pipeline." items={data.notifications} />
      </section>

      <section id="activity" className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ActivityFeed items={data.activities} />
        <Card>
          <CardHeader>
            <CardTitle>Activity scope</CardTitle>
            <CardDescription>Your own application and profile actions are listed here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {[
              'Submitted applications appear here',
              'Profile and resume changes are captured',
              'Login and session events remain auditable',
              'Notifications can be cross-checked against activity history'
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200/10 bg-slate-100/5 px-4 py-3">{item}</div>)}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
