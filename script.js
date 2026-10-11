// Crustella Cloud Kitchen. WhatsApp order handoff; Supabase backend will be connected later.
const WHATSAPP_NUMBER="21694027423";
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
function renderCart(){ $("count").textContent=count();$("total").textContent=money(total());$("checkout-total").textContent=money(total());const chosen=products.filter(p=>cart.has(p.id));$("cart-items").innerHTML=chosen.length?chosen.map(p=>`<div class="line"><div><strong>${p.name}</strong><small>${money(p.price)} · Sous-total ${money(p.price*cart.get(p.id))}</small></div><div class="qty"><button type="button" data-delta="-1" data-id="${p.id}" aria-label="Retirer">−</button><b>${cart.get(p.id)}</b><button type="button" data-delta="1" data-id="${p.id}" aria-label="Ajouter">＋</button></div></div>`).join(""):'<div class="empty">Ton panier est vide. Ajoute quelque chose de bon !</div>'}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts(b.dataset.filter)}));
$("products").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){add(b.dataset.add);toast("Ajouté au panier !")}});
$("cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-delta]");if(b)add(b.dataset.id,Number(b.dataset.delta))});
$("open-cart").addEventListener("click",()=>{$("overlay").hidden=false;document.body.style.overflow="hidden"});
function closeCart(){$("overlay").hidden=true;document.body.style.overflow=""}
$("close-cart").addEventListener("click",closeCart);$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closeCart()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("overlay").hidden)closeCart()});
$("checkout").addEventListener("submit",e=>{e.preventDefault();if(!count()){toast("Ton panier est vide.");return}const f=new FormData(e.currentTarget),name=String(f.get("name")||"").trim(),phone=String(f.get("phone")||"").trim(),address=String(f.get("address")||"").trim(),note=String(f.get("note")||"").trim();if(!name||!phone||!address){toast("Complète les champs obligatoires.");return}const lines=products.filter(p=>cart.has(p.id)).map(p=>`• ${p.name} x${cart.get(p.id)} — ${money(p.price*cart.get(p.id))}`);const msg=["🍔 *NOUVELLE COMMANDE — CRUSTELLA*","",...lines,"","*Total estimé : "+money(total())+"*","*Paiement : à la livraison*","","*Client :* "+name,"*Téléphone :* "+phone,"*Adresse :* "+address,note?"*Note :* "+note:"","Merci de confirmer la commande et le délai de livraison."].filter(Boolean).join("\n");window.open("https://wa.me/"+WHATSAPP_NUMBER+"?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer")});
$("year").textContent=new Date().getFullYear();renderProducts();renderCart();

// PWA installation on supported browsers.
let deferredInstallPrompt=null;
const installButton=$("install-app");
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installButton.hidden=false;
});
installButton?.addEventListener("click",async()=>{
  if(!deferredInstallPrompt){toast("Sur Android, ouvre le menu du navigateur puis « Installer l’application ».");return}
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  installButton.hidden=true;
});
window.addEventListener("appinstalled",()=>{installButton.hidden=true;toast("Crustella est installée !")});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("PWA offline cache unavailable",err)));
}