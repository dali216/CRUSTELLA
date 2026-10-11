# Crustella Cloud Kitchen

Static storefront for GitHub Pages. White/orange visual identity, Tunisian menu, shopping cart and WhatsApp order handoff. Payment method: cash on delivery.

## Files
- `index.html` — storefront
- `style.css` — responsive styling
- `script.js` — menu, cart, WhatsApp checkout
- `admin.html` — admin/backend setup placeholder
- `supabase/schema.sql` — starter database schema

## WhatsApp
Orders are composed for **+216 94 027 423**. The customer must press Send in WhatsApp. Opening WhatsApp does not mean the order has been saved in a database.

## Publish with GitHub Pages
1. Open repository Settings → Pages.
2. Under Build and deployment, choose **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`, then Save.
4. Wait for GitHub Pages to publish and use the URL shown in Settings → Pages.

## Backend required for a real admin dashboard
GitHub Pages only serves static files. It cannot securely authenticate an admin or persist private order records on its own. Recommended option: Supabase (Auth + Postgres + Row Level Security + Edge Functions).
1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Configure admin role assignment securely; do not allow public users to promote themselves.
4. Create a server-side Edge Function that validates order payloads and inserts orders.
5. Store Supabase URL and the publishable/anon key in public frontend configuration only if RLS is correctly configured. Keep the service-role key and all secrets only in Supabase Edge Function secrets.
6. Build an authenticated admin page that reads orders through RLS-protected queries.

## Important
The current checkout hands off to WhatsApp and does not create a database record. Delivery fee, delivery area, opening hours, and final menu wording/prices should be confirmed before launch. Prices included here reflect the initial menu draft and should be verified by the owner.