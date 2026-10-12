import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Authenticated admin-only registration endpoint for browser Push subscriptions.
const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ALLOWED_ORIGIN = "https://dali216.github.io";
const cors = {"Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json"};
const json = (status:number, body:unknown) => new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async req => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.headers.get("origin") && req.headers.get("origin")!==ALLOWED_ORIGIN) return json(403,{error:"Origin not allowed"});
  if(req.method!=="POST") return json(405,{error:"Method not allowed"});
  if(!URL||!SERVICE_KEY||!ANON_KEY) return json(500,{error:"Function is not configured"});
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token) return json(401,{error:"Login required"});
  const authClient=createClient(URL,ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await authClient.auth.getUser(token);
  if(userError||!userData.user) return json(401,{error:"Session expired; sign in again"});
  const db=createClient(URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:admin,error:adminError}=await db.from("admin_users").select("user_id").eq("user_id",userData.user.id).maybeSingle();
  if(adminError||!admin) return json(403,{error:"Administrator access required"});
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json(400,{error:"Invalid JSON"});}
  const subscription=body.subscription as Record<string,unknown>|undefined;
  const endpoint=typeof subscription?.endpoint==="string"?subscription.endpoint:"";
  const keys=subscription?.keys as Record<string,unknown>|undefined;
  if(!endpoint.startsWith("https://")||typeof keys?.p256dh!=="string"||typeof keys?.auth!=="string") return json(400,{error:"Invalid push subscription"});
  const {error}=await db.from("admin_push_subscriptions").upsert({user_id:userData.user.id,endpoint,subscription},{onConflict:"endpoint"});
  if(error){console.error("subscription save failed",error.message);return json(500,{error:"Could not save push subscription. Run supabase/schema.sql in SQL Editor."});}
  return json(200,{ok:true});
});
