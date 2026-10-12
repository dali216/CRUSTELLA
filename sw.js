const CACHE_NAME="crustella-shell-v2";
const APP_SHELL=["./","./index.html","./style.css","./script.js","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET" || new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response && response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match("./index.html"))));
});

// Show background web-push notifications even when the admin page is closed.
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {body:event.data ? event.data.text() : "Une nouvelle commande est arrivée."}; }
  event.waitUntil(self.registration.showNotification(data.title || "Nouvelle commande Crustella", {
    body:data.body || "Une nouvelle commande vient d’arriver.",
    icon:"./icons/icon.svg", badge:"./icons/icon.svg",
    tag:data.tag || "crustella-new-order", renotify:true,
    data:{url:data.url || "./admin.html"}, vibrate:[250,120,250]
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./admin.html", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients => {
    for (const client of clients) if (client.url.startsWith(self.location.origin) && "focus" in client) {
      client.navigate(target); return client.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
