self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Dummy-Worker: Zwingt die App dazu, immer die Live-Daten aus Supabase zu ziehen
});
