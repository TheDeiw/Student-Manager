const CACHE_NAME = "student-manager-cache-v9";
const ASSETS = [
    "/Student-Manager/index.html",
    "/Student-Manager/dashboard.html",
    "/Student-Manager/messages.html",
    "/Student-Manager/tasks.html",
    "/Student-Manager/manifest.json",
    "/Student-Manager/service-worker.js",
    "/Student-Manager/js/init_sw.js",
    "/Student-Manager/js/side_menu.js",
    "/Student-Manager/js/table_control.js",
    "/Student-Manager/css/adaptability.css",
    "/Student-Manager/css/forms.css",
    "/Student-Manager/css/style.css",
    "/Student-Manager/assets/img/header/Avatar.jpg",
    "/Student-Manager/assets/img/header/Logout.svg",
    "/Student-Manager/assets/img/header/Notification-bell.svg",
    "/Student-Manager/assets/img/header/Profile.svg",
    "/Student-Manager/assets/img/navigation/Arrow.svg",
    "/Student-Manager/assets/img/navigation/Dashboard.svg",
    "/Student-Manager/assets/img/navigation/Students.svg",
    "/Student-Manager/assets/img/navigation/Tasks.svg",
    "/Student-Manager/assets/img/students-table/delete.svg",
    "/Student-Manager/assets/img/students-table/edit.svg",
    "/Student-Manager/assets/img/students-table/plus.svg",
    "/Student-Manager/assets/img/modal-windows/close.svg",
    "/Student-Manager/assets/favicon/favicon.ico",
    "/Student-Manager/assets/img/PWA-logo/pwa-logo-128.png",
    "/Student-Manager/assets/img/PWA-logo/pwa-logo-192.png",
    "/Student-Manager/assets/img/PWA-logo/pwa-logo-256.png",
    "/Student-Manager/assets/img/PWA-logo/pwa-logo-500.png",
];

// Встановлення Service Worker та кешування файлів
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("Caching files...");
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log("Caching complete!");
            })
            .catch((err) => {
                console.error("Cache installation failed:", err);
            })
    );
});

self.addEventListener("activate", (event) => {
    console.log("Activating new service worker...");
    event.waitUntil(
        caches
            .keys()
            .then((keys) => {
                return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
            })
            .then(() => {
                console.log("Old caches deleted!");
                return self.clients.claim();
            })
    );
});

// Перехоплення запитів та оновлення кешу
self.addEventListener("fetch", (event) => {
    console.log(`Intercepting request for: ${event.request.url}`);
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                console.log(`Serving from cache: ${event.request.url}`);
                return response;
            }
            console.log(`Fetching from network: ${event.request.url}`);
            return fetch(event.request);
        })
    );
});
