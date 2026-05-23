# SIIF Internship Portal

A modern internship management portal for incubator admins, companies, and students.

## Stack

* Next.js 14 + React 18
* Tailwind CSS
* Supabase Postgres and Storage
* Custom auth with bcrypt-hashed passwords and database-backed sessions

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, anon key, service role key, app URL, and SMTP email settings.
3. Apply the schema in `supabase/schema.sql` to your Supabase project.
4. Run the app with `npm run dev`.

### Environment variables

The app uses these variables from `.env.local`:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `APP_URL` or `NEXT_PUBLIC_APP_URL`
* `EMAIL_SMTP_HOST`
* `EMAIL_SMTP_PORT`
* `EMAIL_SMTP_USER`
* `EMAIL_SMTP_PASSWORD`
* `EMAIL_SMTP_SECURE`
* `EMAIL_FROM`

## Production deployment

Use a clean build in the same environment where the server will run.

1. Install dependencies with `npm ci`.
2. Remove old build output with `Remove-Item -Recurse -Force .next` (PowerShell) or `rm -rf .next` (bash).
3. Build with `npm run build`.
4. Start with `npm start`.

If port `3000` is already occupied, run `npm start -- -p 3101` (or any open port).

## Troubleshooting runtime errors

If you see an App Router production error like `Cannot read properties of undefined (reading 'clientModules')`:

1. Ensure you are not reusing a stale `.next` directory between images/containers/releases.
2. Rebuild and start in the same runtime environment.
3. Confirm there is no duplicate page route for the same path.
4. Verify production boots by requesting `/` after `npm start`.

## Key routes

* `/` marketing landing page
* `/portal` role-aware redirect to the correct dashboard
* `/login`, `/register`, `/forgot-password` auth screens
* `/admin`, `/company`, `/student` protected dashboards

## Backend model

* Users are stored in the `users` table.
* Passwords are hashed with `bcryptjs`.
* Sessions are stored in the `sessions` table and tracked with httpOnly cookies.
* Company approvals are controlled by incubator admins.
* File uploads go through Supabase Storage.
