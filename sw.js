/* Service worker: caches the app shell so Ventas de Feria works with no
   signal at the market. First load needs a connection (to fetch the app
   and the Google Fonts); everything after that is served from cache. */

var CACHE_VERSION = "v2";
var PRECACHE = "mateflor-precache-" + CACHE_VERSION;
var RUNTIME = "mateflor-runtime-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/logo-mateflor.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(PRECACHE)
      .then(function(cache){ return cache.addAll(PRECACHE_URLS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== PRECACHE && k !== RUNTIME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  var isSameOrigin = url.origin === self.location.origin;
  if (!isFont && !isSameOrigin) return;

  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(isFont ? RUNTIME : PRECACHE).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    }).catch(function(){
      if (req.mode === "navigate") return caches.match("./index.html");
    })
  );
});
