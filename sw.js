const CACHE_NAME = "v2.4_cache";
const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./theme.css",
    "./theme-dark.css",
    "./icon-192.png", // Tambahkan ini
    "./icon-512.png", // Tambahkan ini
    "https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js",
    "https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap",
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
];

// Install Service Worker
self.addEventListener("install", event => {
    // Langsung aktifkan versi baru tanpa menunggu semua tab lama ditutup
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Hapus cache versi lama saat service worker baru aktif
self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// Fetch data dari cache jika offline
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
