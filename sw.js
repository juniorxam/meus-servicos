const CACHE_NAME = 'controlserv-v2.2';

self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('Service Worker instalado');
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker ativado');
});

self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});