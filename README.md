# Crustella Cloud Kitchen

White/orange mobile-first ordering website for the Tunisian Crustella Cloud Kitchen brand.

## Current features
- Menu and prices already added from the previous draft.
- Shopping cart, quantity controls and order total.
- Customer name, phone, delivery address and optional note.
- Cash on delivery.
- WhatsApp order handoff to **+216 94 027 423**.
- Progressive Web App (PWA) manifest and service worker for supported install/offline shell.
- Android WebView wrapper project under `android/`; GitHub Actions builds a debug APK.
- Admin preparation page and Supabase SQL starter; backend is not connected yet.

## Website
Repository: https://github.com/dali216/CRUSTELLA  
Expected GitHub Pages address: https://dali216.github.io/CRUSTELLA/

To publish/check it: **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**. Save and wait for deployment.

## Android APK
Every push to `main` should start the workflow **Build Crustella Android APK**. Open the repository's **Actions** tab, choose the latest successful run, and download the artifact named `crustella-debug-apk`. This is a debug APK for testing/installing; it is not a Play Store release.

The Android wrapper loads the hosted website, so GitHub Pages must be published and the phone needs internet access for live ordering. PWA installation from Chrome on Android is another installable option and does not require an APK.

## WhatsApp order flow
Checkout opens WhatsApp with a prepared order message. The customer must press **Send**. The website does not yet store orders in a shared database, send automatic push notifications, or deliver a copy to an admin dashboard.

## Supabase later
Run `supabase/schema.sql` in the Supabase SQL Editor only after reviewing it. To make the admin dashboard and order history real, connect Supabase Auth and a server-side Edge Function, then apply least-privilege RLS policies. Use only the public anon/publishable key in frontend configuration. **Never put the Supabase service_role key, passwords, or webhook secrets in this public repository.**

## Menu prices currently in the site
- Makloub l’ordinaire — 8 DT
- Makloub thon — 7.500 DT
- Makloub poulet fumé — 9 DT
- Makloub jambon — 7 DT
- Makloub escalope panée — 8 DT
- Baguette farcie l’ordinaire — 9 DT
- Baguette farcie maxi — 12 DT
- Frites — 2 DT
- Fromage Rodha — 1.500 DT
- Supplément jambon — 1 DT

Update the menu in `script.js` when prices/items change.
