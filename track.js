(() => {
  const $=id=>document.getElementById(id), cfg=window.CRUSTELLA_SUPABASE||{};
  const token=new URLSearchParams(location.search).get("token")||"";
  const labels={new:"Commande reçue",confirmed:"Commande confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Commande livrée",cancelled:"Commande annulée"};
  const steps=[["new","Reçue"],["confirmed","Confirmée"],["preparing","Préparation"],["out_for_delivery","En livraison"],["delivered","Livrée"]];
  const money=n=>(Number(n||0)/1000).toLocaleString("fr-TN",{minimumFractionDigits:3,maximumFractionDigits:3})+" DT";
  const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let busy=false;
  async function refresh(){
    if(busy)return;busy=true;
    if(!token){$("track-message").textContent="Le lien ne contient pas de jeton de suivi. Ouvre le lien reçu après ta commande.";busy=false;return;}
    if(!cfg.url||!cfg.publishableKey){$("track-message").textContent="Le suivi est en cours de configuration.";busy=false;return;}
    try{
      const r=await fetch(cfg.url+"/functions/v1/track-order",{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.publishableKey,"Authorization":"Bearer "+cfg.publishableKey},body:JSON.stringify({token})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||"Suivi momentanément indisponible");
      $("track-title").textContent="Commande #"+d.order_number;
      $("track-subtitle").textContent="Dernière mise à jour : "+new Date().toLocaleTimeString("fr-TN",{hour:"2-digit",minute:"2-digit"});
      $("track-status").className="track-status "+safe(d.status);
      $("track-status").textContent=labels[d.status]||"Statut actualisé";
      const active=steps.findIndex(s=>s[0]===d.status);
      $("track-steps").innerHTML=steps.map((s,i)=>'<div class="track-step '+(d.status==="cancelled"?"":i<=active?"active":"")+'">'+safe(s[1])+'</div>').join("");
      $("track-items").innerHTML=(d.items||[]).map(i=>'<div class="track-item"><span>'+safe(i.name)+' × '+safe(i.quantity)+'</span></div>').join("")||'<p class="muted">Aucun article affiché.</p>';
      $("track-total").textContent=money(d.total_millimes);
      $("track-message").textContent=d.status==="cancelled"?"Cette commande a été annulée. Contacte Crustella si tu as des questions.":"Le statut est actualisé automatiquement environ toutes les 15 secondes. Cette page n’affiche ni ton téléphone, ni ton adresse exacte, ni tes coordonnées GPS.";
    }catch(err){$("track-message").textContent=err.message||"Impossible de charger le suivi.";}
    finally{busy=false;}
  }
  $("track-refresh").addEventListener("click",refresh);
  refresh();setInterval(refresh,15000);
})();