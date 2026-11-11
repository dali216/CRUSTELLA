# Crustella Manager — Website

A responsive web dashboard for Crustella operations.

## Deploy
Enable GitHub Pages in repository Settings → Pages → Build and deployment → GitHub Actions. The workflow in `.github/workflows/pages.yml` deploys the site on every push to `main`.

## Supabase
1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Create an Auth user for the administrator.
3. Open the website and choose **Configurer Supabase**.
4. Enter the Supabase Project URL and anon/publishable key. Never enter the service_role key.
5. Sign in using the Auth user.

The site uses Supabase Auth and reads the configured tables. The database must have appropriate RLS policies. The starter schema policies are broad for authenticated users; refine role permissions before inviting staff.

## Modules
Dashboard, orders, employee profiles, attendance, stock, technical sheets, cash entries, leave requests and announcements.

This is a web-only project; it does not build an Android APK.