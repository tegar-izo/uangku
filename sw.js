// Skema versi: uangku-MAYOR.MINOR.PATCH
// - MINOR (x1) naik setiap ada fitur baru
// - PATCH (x2) naik setiap ada perbaikan bug
const CACHE_NAME = "uangku-5.1.0";

// Hanya aset inti yang di-precache. Ikon 512 dipakai saat instalasi PWA,
// jadi tidak perlu ikut diunduh saat load pertama.
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./theme.css",
    "./manifest.json",
    "./icon-192.png"
];

// Install Service Worker
self.addEventListener("install", event => {
    // Langsung aktifkan versi baru tanpa menunggu semua tab lama ditutup
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .catch(() => {
                // Precaching gagal (mis. offline): tetap lanjut agar SW terpasang
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

// Sajikan dari cache lebih dulu (instan), lalu perbarui di latar belakang
self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    // Semua aset kini same-origin; request lain dibiarkan ke jaringan
    if (new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request).then(cached => {
            const network = fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches
                            .open(CACHE_NAME)
                            .then(cache => cache.put(request, copy))
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || network;
        })
    );
});
