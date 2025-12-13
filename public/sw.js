/// Custom service worker je SADA NAMJERNO PASIVAN.
/// Vite PWA plugin (vite-plugin-pwa) generiše svoj vlastiti service worker
/// koji upravlja keširanjem, offline režimom i update-ima.
/// Ovaj fajl je ostavljen samo radi kompatibilnosti i debug logova,
//  da ne bi ometao Workbox / VitePWA SW.

// Verzija ovog pasivnog SW-a (za debug)
const SW_VERSION = 'bde-sw-passive-v5.0.0';

self.addEventListener('install', (event) => {
  console.log(`🛠 [Custom SW - PASSIVE] Installing (verzija: ${SW_VERSION})`);
  // Ne keširamo ništa, odmah aktiviramo
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log(`✅ [Custom SW - PASSIVE] Activated (verzija: ${SW_VERSION})`);
  event.waitUntil(self.clients.claim());
});

// Ne presrećemo mrežne zahtjeve – sve puštamo prema mreži / drugim SW-ovima.
// Ovo sprečava konflikte sa Workbox SW-om koji generiše vite-plugin-pwa.
self.addEventListener('fetch', (event) => {
  // Samo log za debug (ako preuzme fetch, ali idealno neće)
  // console.log('[Custom SW - PASSIVE] Fetch:', event.request.url);
});

// I dalje možemo slušati push/sync/eventualne poruke ako ikad zatreba,
// ali trenutno ih namjerno ne koristimo, da ne dupliramo logiku VitePWA SW-a.

self.addEventListener('push', (event) => {
  console.log('🔔 [Custom SW - PASSIVE] Push event (trenutno ignorisan)');
});

self.addEventListener('sync', (event) => {
  console.log('🔄 [Custom SW - PASSIVE] Background sync event (trenutno ignorisan)');
});

self.addEventListener('message', (event) => {
  console.log('💬 [Custom SW - PASSIVE] Poruka iz main aplikacije:', event.data);
});

self.addEventListener('error', (event) => {
  console.error('🚨 [Custom SW - PASSIVE] Greška u service workeru:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [Custom SW - PASSIVE] Unhandled promise rejection u service workeru:', event);
});

console.log(`🚀 [Custom SW - PASSIVE] Učitavanje SW fajla završeno (verzija: ${SW_VERSION})`);
