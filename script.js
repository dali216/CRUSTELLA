// Crustella Cloud Kitchen. Orders are saved to Supabase and managed from the private Admin Dashboard.
const products=[
{id:"m-normal",name:"Makloub l’ordinaire",category:"makloub",price:8,emoji:"🥙",desc:"Le classique généreux, préparé à la commande."},
{id:"m-tuna",name:"Makloub thon",category:"makloub",price:7.5,emoji:"🐟",desc:"Une option au thon, fraîche et savoureuse."},
{id:"m-smoked",name:"Makloub poulet fumé",category:"makloub",price:9,emoji:"🥙",desc:"Poulet fumé, goût intense et gourmand."},
{id:"m-ham",name:"Makloub jambon",category:"makloub",price:7,emoji:"🥪",desc:"Simple, gourmand et plein de caractère."},
{id:"m-escalope",name:"Makloub escalope panée",category:"makloub",price:8,emoji:"🍗",desc:"Escalope panée et croustillante."},
{id:"b-ordinary",name:"Baguette farcie l’ordinaire",category:"baguette",price:9,emoji:"🥖",desc:"Baguette dorée, farce généreuse et fromage fondant."},
{id:"b-maxi",name:"Baguette farcie maxi",category:"baguette",price:12,emoji:"🥖",desc:"Format maxi pour les grosses faims."},
{id:"x-fries",name:"Frites",category:"extras",price:2,emoji:"🍟",desc:"L’accompagnement croustillant."},
{id:"x-rodha",name:"Fromage Rodha",category:"extras",price:1.5,emoji:"🧀",desc:"Supplément fromage."},
{id:"x-ham",name:"Supplément jambon",category:"extras",price:1,emoji:"🥓",desc:"Un supplément gourmand."}
];
const cart=new Map(),$=id=>document.getElementById(id),money=n=>n.toFixed(3).replace(".",",")+" DT";
const label=c=>({makloub:"MAKLOUB",baguette:"BAGUETTE FARCIE",extras:"EXTRA"}[c]||c);
function renderProducts(filter="all"){$("products").innerHTML=products.filter(p=>filter==="all"||p.category===filter).map(p=>`<article class="card"><div class="food"><span class="tag">${label(p.category)}</span>${p.emoji}</div><div class="details"><div class="title-row"><h3>${p.name}</h3><span class="price">${money(p.price)}</span></div><p>${p.desc}</p><button class="add" data-add="${p.id}">＋ Ajouter au panier</button></div></article>`).join("")}
function total(){return products.reduce((s,p)=>s+p.price*(cart.get(p.id)||0),0)}
function count(){return [...cart.values()].reduce((s,n)=>s+n,0)}
function add(id,delta=1){const n=(cart.get(id)||0)+delta;if(n<=0)cart.delete(id);else cart.set(id,n);renderCart()}
function renderCart(){ $("count").textContent=count();$("total").textContent=money(total());$("checkout-total").textContent=money(total());const chosen=products.filter(p=>cart.has(p.id));$("cart-items").innerHTML=chosen.length?chosen.map(p=>`<div class="line"><div><strong>${p.name}</strong><small>${money(p.price)} · Sous-total ${money(p.price*cart.get(p.id))}</small></div><div class="qty"><button type="button" data-delta="-1" data-id="${p.id}" aria-label="Retirer">−</button><b>${cart.get(p.id)}</b><button type="button" data-delta="1" data-id="${p.id}" aria-label="Ajouter">＋</button></div></div>`).join(""):'<div class="empty">Ton panier est vide. Ajoute quelque chose de bon !</div>';const upsell=$("cart-upsell");const hasMain=products.some(p=>(p.category==="makloub"||p.category==="baguette")&&cart.has(p.id));const suggestions=products.filter(p=>p.category==="extras"&&!cart.has(p.id)).slice(0,2);if(upsell){upsell.hidden=!count()||!hasMain||!suggestions.length;upsell.innerHTML=upsell.hidden?"":"<strong>Complète ton menu ✨</strong><p>Deux extras qui vont bien avec ton choix.</p>"+suggestions.map(p=>`<button type="button" class="upsell-item" data-upsell="${p.id}"><span>${p.emoji} ${p.name}</span><b>+ ${money(p.price)}</b></button>`).join("")}}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts(b.dataset.filter)}));
$("products").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){add(b.dataset.add);toast("Ajouté au panier !")}});
$("cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-delta]");if(b)add(b.dataset.id,Number(b.dataset.delta))});
$("cart-upsell")?.addEventListener("click",e=>{const b=e.target.closest("[data-upsell]");if(b){add(b.dataset.upsell);toast("Extra ajouté au panier !")}});
$("open-cart").addEventListener("click",()=>{$("overlay").hidden=false;document.body.style.overflow="hidden"});
function closeCart(){$("overlay").hidden=true;document.body.style.overflow=""}
$("close-cart").addEventListener("click",closeCart);$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closeCart()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("overlay").hidden)closeCart()});
let deliveryPosition=null;
const locationButton=$("get-location");
function requestDeliveryLocation(){
  const status=$("location-status");
  const consent=$("checkout").elements.namedItem("gpsConsent");
  if(!consent?.checked){status.textContent="Coche d’abord la case de consentement. Le GPS reste facultatif.";return;}
  if(!window.isSecureContext){status.textContent="Le GPS nécessite une connexion HTTPS. Ouvre le site officiel Crustella.";return;}
  if(!navigator.geolocation){status.textContent="La géolocalisation n’est pas prise en charge par ce navigateur. Vérifie les réglages de localisation.";return;}
  if(locationButton)locationButton.disabled=true;
  status.textContent="Recherche de ta position GPS… Autorise la localisation si le navigateur le demande.";
  const finish=()=>{if(locationButton)locationButton.disabled=false;};
  const success=pos=>{
    deliveryPosition={lat:pos.coords.latitude,lng:pos.coords.longitude};
    status.textContent="Position GPS obtenue (précision approximative : "+Math.round(pos.coords.accuracy)+" m). Elle sera envoyée avec ta commande.";
    finish();
  };
  const failure=err=>{
    if(err.code===1)status.textContent="Autorisation GPS refusée. Autorise la localisation pour ce site dans les réglages du navigateur, puis réessaie.";
    else if(err.code===2)status.textContent="Position introuvable. Active la localisation/GPS du téléphone et réessaie.";
    else if(err.code===3)status.textContent="La recherche GPS a pris trop de temps. Active la localisation et réessaie.";
    else status.textContent="GPS indisponible. Tu peux toujours commander avec l’adresse écrite.";
    finish();
  };
  navigator.geolocation.getCurrentPosition(success,err=>{
    if(err.code===1){failure(err);return;}
    status.textContent="Recherche GPS plus précise…";
    navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,timeout:20000,maximumAge:0});
  },{enableHighAccuracy:false,timeout:12000,maximumAge:0});
}
locationButton?.addEventListener("click",requestDeliveryLocation);
$("checkout").elements.namedItem("gpsConsent")?.addEventListener("change",e=>{
  if(!e.target.checked){
    deliveryPosition=null;
    $("location-status").textContent="Le partage GPS est désactivé.";
  }else{
    deliveryPosition=null;
    $("location-status").textContent="Consentement enregistré. Appuie sur « Utiliser ma position » puis autorise la localisation.";
  }
});
$("checkout").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!count()){toast("Ton panier est vide.");return;}
  const form=e.currentTarget, f=new FormData(form);
  const name=String(f.get("name")||"").trim(),phone=String(f.get("phone")||"").trim(),address=String(f.get("address")||"").trim(),note=String(f.get("note")||"").trim();
  if(!name||!phone||!address){toast("Complète les champs obligatoires.");return;}
  const cfg=window.CRUSTELLA_SUPABASE||{}, result=$("order-result"), submit=form.querySelector('button[type="submit"]');
  if(!cfg.url||!cfg.publishableKey){result.textContent="Service de commande indisponible : configuration Supabase manquante.";return;}
  const payload={customer_name:name,customer_phone:phone,delivery_address:address,customer_note:note||null,items:products.filter(p=>cart.has(p.id)).map(p=>({id:p.id,quantity:cart.get(p.id)})),payment_method:"cash_on_delivery"};
  if(f.get("gpsConsent")==="on"&&deliveryPosition){payload.delivery_lat=deliveryPosition.lat;payload.delivery_lng=deliveryPosition.lng;}
  submit.disabled=true;submit.textContent="Enregistrement…";result.textContent="Enregistrement sécurisé de la commande…";
  try{
    const response=await fetch(cfg.url+"/functions/v1/create-order",{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.publishableKey,"Authorization":"Bearer "+cfg.publishableKey},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok)throw new Error(data.error||"La commande n’a pas pu être enregistrée.");
    const trackUrl=new URL("track.html",location.href);trackUrl.searchParams.set("token",data.tracking_token);
    result.textContent="Commande enregistrée avec succès (#"+String(data.order_number).replace(/[&<>"']/g,"")+ "). ";
    const trackingLink=document.createElement("a");trackingLink.href=trackUrl.href;trackingLink.textContent="Ouvrir le suivi ↗";result.append(trackingLink);result.append(" — Crustella a reçu ta commande dans son tableau de bord.");
    cart.clear();renderCart();form.reset();deliveryPosition=null;$("location-status").textContent="";toast("Commande envoyée à Crustella !");
  }catch(err){result.textContent="Erreur : "+(err.message||"connexion impossible")+". La commande n’a pas été confirmée. Réessaie dans quelques instants.";} 
  finally{submit.disabled=false;submit.textContent="Confirmer la commande ↗";}
});
$("year").textContent=new Date().getFullYear();renderProducts();renderCart();

// PWA installation on supported browsers.
let deferredInstallPrompt=null;
const installButton=$("install-app");
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
if(isIOS)installButton.hidden=false;
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installButton.hidden=false;
});
installButton?.addEventListener("click",async()=>{
  if(!deferredInstallPrompt){if(isIOS){const dialog=$("install-help");if(dialog?.showModal)dialog.showModal();else toast("Dans Safari : Partager → Sur l’écran d’accueil.");}else toast("Ouvre le menu de ton navigateur puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».");return}
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  installButton.hidden=true;
});
window.addEventListener("appinstalled",()=>{installButton.hidden=true;toast("Crustella est installée !")});
$("close-install-help")?.addEventListener("click",()=> $("install-help")?.close());
$("install-help")?.addEventListener("click",e=>{if(e.target===$("install-help"))$("install-help").close()});
$("share-app")?.addEventListener("click",async()=>{const shareData={title:"Crustella Cloud Kitchen",text:"Jou3ak malouch a3dhar — découvre le menu Crustella !",url:location.href};try{if(navigator.share)await navigator.share(shareData);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);toast("Lien Crustella copié !");}else toast("Copie le lien depuis la barre d’adresse.");}catch(err){if(err?.name!=="AbortError")toast("Partage indisponible sur ce navigateur.");}});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("PWA offline cache unavailable",err)));
}