# Crustella Cloud Kitchen

White/orange mobile-first ordering website for the Tunisian Crustella Cloud Kitchen brand.

## Current features
- Menu and prices already added from the previous draft.
- Shopping cart, quantity controls and order total.
- Customer name, phone, delivery address and optional note.
- Cash on delivery.
- Orders saved securely in Supabase and managed from the private Admin Dashboard.
- Optional consent-based GPS location for delivery; customer tracking link hides personal address and phone.
- Progressive Web App (PWA) manifest and service worker for supported install/offline shell.
- Android WebView wrapper project under `android/`; GitHub Actions builds a debug APK.
- Admin dashboard with sign-in, live order updates, status changes, browser notifications, and map link for delivery.

## Website
Repository: https://github.com/dali216/CRUSTELLA  
Expected GitHub Pages address: https://dali216.github.io/CRUSTELLA/

To publish/check it: **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**. Save and wait for deployment.

## Android APK
Every push to `main` should start the workflow **Build Crustella Android APK**. Open the repository's **Actions** tab, choose the latest successful run, and download the artifact named `crustella-debug-apk`. This is a debug APK for testing/installing; it is not a Play Store release.

The Android wrapper loads the hosted website, so GitHub Pages must be published and the phone needs internet access for live ordering. PWA installation from Chrome on Android is another installable option and does not require an APK.

## Order flow
Checkout saves orders through the `create-order` Supabase Edge Function. The server validates item IDs, quantities and prices. Orders appear in the private Admin Dashboard; the admin can change the status, and customers can follow the order through a tokenized tracking link. Payment is cash on delivery. Optional GPS coordinates are sent only after explicit customer consent.

## Supabase setup
Follow [SUPABASE-SETUP.md](SUPABASE-SETUP.md). The database schema must be run in the Supabase SQL Editor and both Edge Functions deployed. GitHub Actions deployment also requires the repository secret `SUPABASE_ACCESS_TOKEN`. Only the public publishable key is included in frontend configuration; never commit a service-role key or other secret.

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
