# SIIF Internship Portal

A modern internship management portal for incubator admins, companies, and students.

## Stack

* Next.js 14 + React 18
* Tailwind CSS
* Supabase Postgres and Storage
* Custom auth with bcrypt-hashed passwords and database-backed sessions

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, anon key, and service role key.
3. Apply the schema in `supabase/schema.sql` to your Supabase project.
4. Run the app with `npm run dev`.

## Key routes

* `/` marketing landing page
* `/login`, `/register`, `/forgot-password` auth screens
* `/admin`, `/company`, `/student` protected dashboards

## Backend model

* Users are stored in the `users` table.
* Passwords are hashed with `bcryptjs`.
* Sessions are stored in the `sessions` table and tracked with httpOnly cookies.
* Company approvals are controlled by incubator admins.
* File uploads go through Supabase Storage.
