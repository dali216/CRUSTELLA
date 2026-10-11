import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) return json(403, { ok: false, error: "Origin not allowed" });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
  if (!URL || !SERVICE_KEY) return json(500, { ok: false, error: "Server function is not configured" });

  let token = "";
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token : "";
  } catch { return json(400, { ok: false, error: "Invalid request" }); }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return json(400, { ok: false, error: "Lien de suivi invalide" });
  }

  const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("orders")
    .select("order_number,status,items,total_millimes,created_at")
    .eq("tracking_token", token).maybeSingle();
  if (error) {
    console.error("tracking lookup failed", error.message);
    return json(500, { ok: false, error: "Suivi momentanément indisponible" });
  }
  if (!data) return json(404, { ok: false, error: "Commande introuvable. Vérifie le lien de suivi." });
  const items = Array.isArray(data.items) ? data.items.map((item: Record<string, unknown>) => ({
    name: String(item.name ?? "Article"),
    quantity: Number(item.quantity ?? 1),
  })) : [];
  // Never expose customer name, phone, street address, or precise GPS to the public tracking page.
  return json(200, { ok: true, order_number: data.order_number, status: data.status, items, total_millimes: data.total_millimes, created_at: data.created_at });
});
