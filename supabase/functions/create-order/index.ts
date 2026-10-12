import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGIN = "https://dali216.github.io";
const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
};
const catalog: Record<string, { name: string; price: number }> = {
  "m-normal": { name: "Makloub l’ordinaire", price: 8000 },
  "m-tuna": { name: "Makloub thon", price: 7500 },
  "m-smoked": { name: "Makloub poulet fumé", price: 9000 },
  "m-ham": { name: "Makloub jambon", price: 7000 },
  "m-escalope": { name: "Makloub escalope panée", price: 8000 },
  "b-ordinary": { name: "Baguette farcie l’ordinaire", price: 9000 },
  "b-maxi": { name: "Baguette farcie maxi", price: 12000 },
  "x-fries": { name: "Frites", price: 2000 },
  "x-rodha": { name: "Fromage Rodha", price: 1500 },
  "x-ham": { name: "Supplément jambon", price: 1000 },
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (origin && origin !== ALLOWED_ORIGIN) return json(403, { ok: false, error: "Origin not allowed" });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
  if (!URL || !SERVICE_KEY) return json(500, { ok: false, error: "Server function is not configured" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  const name = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const phone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  const address = typeof body.delivery_address === "string" ? body.delivery_address.trim() : "";
  const note = typeof body.customer_note === "string" ? body.customer_note.trim() : "";
  if (name.length < 2 || name.length > 80) return json(400, { ok: false, error: "Nom invalide" });
  if (!/^[+0-9() .-]{6,30}$/.test(phone)) return json(400, { ok: false, error: "Téléphone invalide" });
  if (address.length < 4 || address.length > 300) return json(400, { ok: false, error: "Adresse invalide" });
  if (note.length > 300) return json(400, { ok: false, error: "Note trop longue" });
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return json(400, { ok: false, error: "Panier invalide" });

  const items: Array<{ id: string; name: string; quantity: number; unit_price_millimes: number; line_total_millimes: number }> = [];
  let total = 0;
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") return json(400, { ok: false, error: "Article invalide" });
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id : "";
    const product = catalog[id];
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return json(400, { ok: false, error: "Article ou quantité invalide" });
    const line = product.price * quantity;
    total += line;
    items.push({ id, name: product.name, quantity, unit_price_millimes: product.price, line_total_millimes: line });
  }
  if (!Number.isSafeInteger(total) || total <= 0 || total > 500000) return json(400, { ok: false, error: "Total invalide" });

  // GPS is saved only when the client explicitly checked consent and the browser obtained a location.
  const lat = body.delivery_lat === undefined ? null : Number(body.delivery_lat);
  const lng = body.delivery_lng === undefined ? null : Number(body.delivery_lng);
  const hasLat = lat !== null && Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const hasLng = lng !== null && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  if ((body.delivery_lat !== undefined || body.delivery_lng !== undefined) && !(hasLat && hasLng)) {
    return json(400, { ok: false, error: "Coordonnées GPS invalides" });
  }

  const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("orders").insert({
    customer_name: name,
    customer_phone: phone,
    phone: phone,
    address: address,
    delivery_address: address,
    customer_note: note || null,
    items,
    total_millimes: total,
    payment_method: "cash_on_delivery",
    delivery_lat: hasLat ? lat : null,
    delivery_lng: hasLng ? lng : null,
  }).select("id,order_number,tracking_token,total_millimes,created_at").single();

  if (error || !data) {
    console.error("order insert failed", error?.message);
    return json(500, { ok: false, error: "Impossible d’enregistrer la commande. Réessaie dans un instant." });
  }
  // Best-effort Push: a notification failure must never undo a valid order.
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (vapidPublic && vapidPrivate) {
    try {
      webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:admin@crustella.tn", vapidPublic, vapidPrivate);
      const { data: subscriptions, error: subError } = await db.from("admin_push_subscriptions").select("id,subscription");
      if (subError) console.error("push subscription lookup failed", subError.message);
      for (const row of subscriptions || []) {
        try {
          await webpush.sendNotification(row.subscription, JSON.stringify({
            title: "Nouvelle commande Crustella",
            body: "Commande #" + data.order_number + " — " + name + " · " + (total / 1000).toFixed(3) + " DT",
            url: "https://dali216.github.io/CRUSTELLA/admin.html",
            tag: "crustella-order-" + data.id
          }));
        } catch (pushError) {
          const statusCode = Number((pushError as { statusCode?: number })?.statusCode || 0);
          console.error("push delivery failed", statusCode || String(pushError));
          if (statusCode === 404 || statusCode === 410) await db.from("admin_push_subscriptions").delete().eq("id", row.id);
        }
      }
    } catch (pushError) { console.error("push notification setup failed", String(pushError)); }
  } else console.warn("Push not configured: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets.");
  return json(201, { ok: true, order_number: data.order_number, tracking_token: data.tracking_token, total_millimes: data.total_millimes, created_at: data.created_at });
});
