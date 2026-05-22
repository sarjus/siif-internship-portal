create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'company', 'student')),
  phone text,
  profile_image text,
  account_status text not null default 'pending_approval' check (account_status in ('pending_approval', 'active', 'suspended', 'disabled')),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  description text,
  website text,
  logo text,
  approved_status boolean not null default false
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  college_name text,
  programme text,
  study_year text,
  current_cgpa text,
  back_papers integer,
  department text,
  skills text[] not null default '{}',
  resume_url text,
  github text,
  linkedin text,
  portfolio text
);

alter table public.student_profiles add column if not exists college_name text;
alter table public.student_profiles add column if not exists programme text;
alter table public.student_profiles add column if not exists study_year text;
alter table public.student_profiles add column if not exists current_cgpa text;
alter table public.student_profiles add column if not exists back_papers integer;

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  about text,
  description text not null,
  who_can_apply text[] not null default '{}',
  other_requirements text[] not null default '{}',
  perks text[] not null default '{}',
  start_date text,
  additional_info text,
  fee_type text not null default 'no_fee' check (fee_type in ('no_fee', 'one_time', 'refundable')),
  fee_amount text,
  fee_notes text,
  duration text not null,
  stipend text not null,
  skills_required text[] not null default '{}',
  deadline date not null,
  location text not null,
  internship_type text not null check (internship_type in ('full_time', 'part_time', 'remote', 'hybrid')),
  openings integer not null default 1,
  created_at timestamp with time zone not null default now()
);

alter table public.internships add column if not exists about text;
alter table public.internships add column if not exists who_can_apply text[] not null default '{}';
alter table public.internships add column if not exists other_requirements text[] not null default '{}';
alter table public.internships add column if not exists perks text[] not null default '{}';
alter table public.internships add column if not exists start_date text;
alter table public.internships add column if not exists additional_info text;
alter table public.internships add column if not exists fee_type text not null default 'no_fee';
alter table public.internships add column if not exists fee_amount text;
alter table public.internships add column if not exists fee_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'internships_fee_type_check'
  ) then
    alter table public.internships
      add constraint internships_fee_type_check check (fee_type in ('no_fee', 'one_time', 'refundable'));
  end if;
end
$$;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  resume_url text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'shortlisted', 'rejected', 'interview', 'hired')),
  applied_date timestamp with time zone not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  revoked_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_by_user_id uuid references public.users(id) on delete set null,
  title text not null,
  body text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists users_role_status_idx on public.users(role, account_status);
create index if not exists companies_user_idx on public.companies(user_id);
create index if not exists internships_company_idx on public.internships(company_id);
create index if not exists applications_internship_idx on public.applications(internship_id);
create index if not exists applications_student_idx on public.applications(student_id);
create index if not exists sessions_token_idx on public.sessions(token_hash);
create index if not exists password_reset_token_idx on public.password_resets(token_hash);
create index if not exists activity_logs_actor_idx on public.activity_logs(actor_user_id, created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.student_profiles enable row level security;
alter table public.internships enable row level security;
alter table public.applications enable row level security;
alter table public.sessions enable row level security;
alter table public.password_resets enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- The portal uses the service role key on the server, so direct client access is not required.
-- Add fine-grained policies only if you later expose selected tables to browser clients.
