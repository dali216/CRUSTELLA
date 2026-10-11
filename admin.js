/* Crustella admin dashboard. Requires supabase-config.js and the SQL policies in supabase/schema.sql. */
(() => {
  const cfg = window.CRUSTELLA_SUPABASE || {};
  const $ = id => document.getElementById(id);
  const statusLabels = {new:"Nouvelle",confirmed:"Confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Livrée",cancelled:"Annulée"};
  let client = null, channel = null, orders = [];
  const money = mills => (Number(mills || 0) / 1000).toLocaleString("fr-TN",{minimumFractionDigits:3,maximumFractionDigits:3}) + " DT";
  const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function message(id, text){ $(id).textContent = text || ""; }
  function showLogin(){ $("login-section").classList.remove("hidden"); $("dashboard-section").classList.add("hidden"); }
  function showDashboard(){ $("login-section").classList.add("hidden"); $("dashboard-section").classList.remove("hidden"); }
  function dateLabel(value){ try{return new Date(value).toLocaleString("fr-TN",{dateStyle:"short",timeStyle:"short"});}catch{return value||"";} }
  function render(){
    $("stat-total").textContent = orders.length;
    $("stat-new").textContent = orders.filter(o=>o.status==="new").length;
    $("stat-preparing").textContent = orders.filter(o=>o.status==="preparing").length;
    $("stat-sales").textContent = money(orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+Number(o.total_millimes||0),0));
    const filter=$("status-filter").value, q=$("order-search").value.trim().toLocaleLowerCase();
    const list=orders.filter(o=>(filter==="all"||o.status===filter) && (!q||[o.customer_name,o.customer_phone,String(o.order_number||"")].some(v=>String(v||"").toLocaleLowerCase().includes(q))));
    if(!list.length){$("orders-list").innerHTML='<div class="empty-state">Aucune commande pour ce filtre. Les nouvelles commandes apparaîtront ici.</div>';return;}
    $("orders-list").innerHTML=list.map(o=>{
      const items=Array.isArray(o.items)?o.items.map(i=>safe(i.name||i.title||i.id)+" × "+safe(i.quantity||i.qty||1)).join(" · "):"";
      const statusOpts=Object.entries(statusLabels).map(([v,l])=>'<option value="'+v+'" '+(o.status===v?'selected':'')+'>'+l+'</option>').join("");
      const mapUrl=o.delivery_lat!=null&&o.delivery_lng!=null?'https://www.google.com/maps?q='+encodeURIComponent(o.delivery_lat+','+o.delivery_lng):'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(o.delivery_address||"");
      return '<article class="order"><div><h3>Commande #'+safe(o.order_number||String(o.id||"").slice(0,8))+' · '+safe(o.customer_name)+'</h3><p>📞 <a href="tel:'+safe(o.customer_phone)+'">'+safe(o.customer_phone)+'</a> · '+safe(dateLabel(o.created_at))+'</p><p>📍 '+safe(o.delivery_address)+' · <a target="_blank" rel="noopener" href="'+mapUrl+'">Ouvrir la carte ↗</a></p><p>🍔 '+items+'</p>'+(o.customer_note?'<p>📝 '+safe(o.customer_note)+'</p>':'')+'<p class="order-total">'+money(o.total_millimes)+' · Paiement à la livraison</p></div><div class="order-actions"><span class="status '+safe(o.status)+'">'+safe(statusLabels[o.status]||o.status)+'</span><select aria-label="Changer le statut" data-status="'+safe(o.id)+'">'+statusOpts+'</select><button class="admin-btn secondary" data-track="'+safe(o.id)+'">Lien suivi</button></div></article>';
    }).join("");
  }
  async function loadOrders(){
    if(!client)return;
    message("dashboard-message","Chargement des commandes…");
    const {data,error}=await client.from("orders").select("*").order("created_at",{ascending:false}).limit(200);
    if(error){message("dashboard-message","Impossible de charger les commandes : "+error.message);return;}
    orders=data||[];render();message("dashboard-message","");
  }
  function watchOrders(){
    if(channel)client.removeChannel(channel);
    channel=client.channel("crustella-admin-orders").on("postgres_changes",{event:"*",schema:"public",table:"orders"},()=>loadOrders()).subscribe();
  }
  async function verifyAdmin(session){
    if(!session){showLogin();return;}
    const {data,error}=await client.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
    if(error||!data){await client.auth.signOut();showLogin();message("login-message","Ce compte n’a pas encore les droits administrateur. Ajoute-le dans public.admin_users depuis Supabase.");return;}
    showDashboard();await loadOrders();watchOrders();
  }
  $("login-form").addEventListener("submit",async e=>{
    e.preventDefault();message("login-message","Connexion…");
    if(!client){message("login-message","Configuration Supabase manquante. Ajoute Project URL et Publishable key dans supabase-config.js.");return;}
    const {data,error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    if(error){message("login-message","Connexion impossible : "+error.message);return;}
    await verifyAdmin(data.session);
  });
  $("logout-btn").addEventListener("click",async()=>{if(channel)await client.removeChannel(channel);await client.auth.signOut();showLogin();});
  $("refresh-btn").addEventListener("click",loadOrders);
  $("status-filter").addEventListener("change",render);$("order-search").addEventListener("input",render);
  $("orders-list").addEventListener("change",async e=>{
    const select=e.target.closest("[data-status]");if(!select)return;
    const id=select.dataset.status, status=select.value;select.disabled=true;
    const {error}=await client.from("orders").update({status}).eq("id",id);
    if(error){message("dashboard-message","Échec de mise à jour : "+error.message);}else{message("dashboard-message","Statut de la commande mis à jour.");await loadOrders();}
    select.disabled=false;
  });
  $("orders-list").addEventListener("click",async e=>{
    const btn=e.target.closest("[data-track]");if(!btn)return;
    const o=orders.find(x=>x.id===btn.dataset.track);if(!o)return;
    const url=new URL("track.html",location.href);url.searchParams.set("id",o.id);
    try{await navigator.clipboard.writeText(url.href);message("dashboard-message","Lien de suivi copié.");}
    catch{window.prompt("Copie le lien de suivi :",url.href);}
  });
  if(!window.supabase||!cfg.url||!cfg.publishableKey||cfg.url.includes("YOUR_")||cfg.publishableKey.includes("YOUR_")){
    $("setup-notice").classList.remove("hidden");
    $("setup-notice").textContent="Configuration à terminer : le tableau de bord est prêt côté interface, mais il faut encore ajouter l’URL et la Publishable key de ton projet Supabase puis appliquer supabase/schema.sql. Aucune commande ne sera inventée ni stockée localement.";
    message("login-message","Supabase n’est pas encore connecté.");
  }else{
    client=window.supabase.createClient(cfg.url,cfg.publishableKey);
    client.auth.getSession().then(({data})=>verifyAdmin(data.session));
    client.auth.onAuthStateChange((_event,session)=>{if(session)verifyAdmin(session);else showLogin();});
  }
})();