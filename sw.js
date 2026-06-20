self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Bleibt leer: Lädt immer live aus dem Netz, speichert keinen alten Cache!
});
