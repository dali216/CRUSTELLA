# Crustella Manager

Android management app for Crustella, built with Kotlin and Jetpack Compose. Brand palette: orange and black.

## Modules planned

- Dashboard: revenue, orders, expenses and net profit
- Orders and order status tracking
- Team profiles and role-based access (admin, manager, employee)
- Attendance clock-in / clock-out, working hours and shifts
- Technical product sheets, ingredient quantities, recipe cost and margin
- Stock and stock movements
- Cash entries, expenses and reports
- Leave requests, announcements and notifications

## Build an APK

Every push to `main` and every manual workflow dispatch runs the Android build.

1. Open **Actions** in this repository.
2. Select **Build Crustella Manager APK**.
3. Open the successful run and download the `Crustella-Manager-debug` artifact.
4. Extract the ZIP; install `app-debug.apk` on an Android phone.

The debug APK is for testing. A signed release build should be configured before wider distribution.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Add the Supabase project URL and anon/public key as Gradle properties or environment variables named `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. Create authenticated users and matching rows in `public.profiles`.

**Important:** the current Android screen is an initial UI scaffold. Live data operations, authentication screens, role enforcement, notifications and the remaining module workflows still need implementation. Do not use the current role selector as a security boundary. The database policies in the starter schema allow authenticated users broad access and must be tightened to role-specific policies before production use. Never put a Supabase service-role key in the Android app.

## Package

`tn.crustella.manager`
