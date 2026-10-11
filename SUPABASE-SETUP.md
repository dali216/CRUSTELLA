# Crustella × Supabase setup

The frontend configuration in `supabase-config.js` contains only the project URL and the **publishable** key. Never commit a database password, `service_role` key, or Supabase access token.

## 1. Create the database tables and policies

1. Open the Supabase project `bnwsnhhvrbwvjwvywjgc`.
2. Go to **SQL Editor → New query**.
3. Paste all of `supabase/schema.sql` and run it.
4. Confirm that `public.orders` and `public.admin_users` exist. Row Level Security must remain enabled.

## 2. Deploy the Edge Functions

This repository includes `create-order` (server validates menu item IDs, quantities and prices before inserting) and `track-order` (returns only the status and order summary, never the customer's phone, address or GPS).

For automatic deploys:
1. In Supabase, open **Account → Access Tokens** and create a personal access token for deployment.
2. In GitHub, open **dali216/CRUSTELLA → Settings → Secrets and variables → Actions → New repository secret**.
3. Name the secret `SUPABASE_ACCESS_TOKEN` and paste the token as its value. Do not put the token in a file or a commit.
4. Open the **Actions** tab and run **Deploy Supabase Edge Functions**, or push a change under `supabase/functions/`.

The Supabase project ref is already configured in the workflow. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions at runtime; do not copy the service-role key into GitHub files or browser code.

## 3. Apply the database SQL manually

The workflow deploys functions only; it does not run database migrations. Execute `supabase/schema.sql` in the Supabase SQL Editor as described above.

## 4. Create the admin login

1. In Supabase, go to **Authentication → Users → Add user** and create the administrator with an email and a strong password.
2. Copy that user's UUID.
3. In **SQL Editor**, run the following after replacing the placeholder with that UUID:

```sql
insert into public.admin_users(user_id)
values ('PASTE_AUTH_USER_UUID_HERE');
```

4. Sign in at [Crustella Admin](https://dali216.github.io/CRUSTELLA/admin.html).
5. In the dashboard, press **Activer notifications** and allow browser notifications. Keep the dashboard open for live order notifications.

## 5. Order flow and GPS privacy

- Checkout first sends the cart to the server function; the server recomputes prices from its own menu catalogue. If saving fails, it does not claim that the order was registered.
- After successful saving, the order appears in the private Admin Dashboard. The customer receives a tracking link on the confirmation page; no WhatsApp handoff is required.
- The GPS checkbox is optional. The browser asks for location permission only after the customer checks consent and taps **Utiliser ma position**. Coordinates are stored only if permission succeeds. Without consent/location, the typed address is used.
- The public tracking page displays status and item summary only. It does not reveal customer name, phone, street address or coordinates.
- Browser notification support depends on the browser and permission; the admin page must remain open to receive live notifications.

## 6. Publish

GitHub Pages serves the frontend from the repository. After the SQL is applied and both functions are deployed, test one low-value order and verify that it appears in Admin, status changes appear on the tracking page, and the tracking URL contains a token (not the database order ID).
