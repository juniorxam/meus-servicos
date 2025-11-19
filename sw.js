// sw.js

// Nome do cache, incrementado a cada nova versão de arquivos (para forçar o update)
const CACHE_NAME = 'controlserv-v1.0.1';

// Lista de todos os arquivos essenciais para o funcionamento offline
const CACHE_ASSETS = [
    './', // Caching do index.html
    'index.html',
    'style.css',
    'manifest.json',
    
    // Scripts do Projeto
    'js/constants.js',
    'js/reports.js',
    'js/app.js',

    // Bibliotecas Externas (CDN)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',

    // Ícones (Adicione todos os paths dos ícones do seu manifest.json)
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    // ... outros ícones
];


// =========================================
// 1. Instalação (Instala o SW e Cacheia os Arquivos)
// =========================================
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalando e Cacheando Shell...');
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service Worker] Cacheando todos os assets.');
            return cache.addAll(CACHE_ASSETS).catch(error => {
                console.error('[Service Worker] Falha ao cachear um ou mais assets:', error);
            });
        })
    );
});


// =========================================
// 2. Ativação (Limpa Caches Antigos)
// =========================================
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Ativando e Limpando Caches Antigos...');
    const cacheWhitelist = [CACHE_NAME];
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Deleta caches que não estão na whitelist (caches antigos)
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// =========================================
// 3. Fetch (Estratégia Cache-First)
// =========================================
self.addEventListener('fetch', (e) => {
    // Intercepta a requisição
    e.respondWith(
        // Tenta encontrar a requisição no cache
        caches.match(e.request)
        .then((response) => {
            // Se encontrou, retorna a resposta do cache
            if (response) {
                return response;
            }
            // Se não encontrou, busca na rede
            return fetch(e.request);
        })
    );
});
