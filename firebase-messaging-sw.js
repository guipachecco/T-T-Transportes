// firebase-messaging-sw.js
const CACHE_APLICATIVO = 'tt-portal-v20260811-3';
const ARQUIVOS_APLICATIVO = [
  '/',
  '/index.html',
  '/manifest.webmanifest?v=20260811-3',
  '/style.css?v=20260811-3',
  '/app.js?v=20260811-3',
  '/pwa.js?v=20260811-3',
  '/firebase-config.js?v=20260811-3',
  '/firebase-init.js?v=20260811-3',
  '/notificacoes.js?v=20260811-3',
  '/imagens.js?v=20260811-3',
  '/sweetalert2.all.min.js?v=20260807-11',
  '/logo.jpeg',
  '/favicon.png?v=20260811-3',
  '/favicon.ico?v=20260811-3',
  '/apple-touch-icon.png?v=20260811-3',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APLICATIVO)
      .then((cache) => cache.addAll(ARQUIVOS_APLICATIVO))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves
          .filter((chave) => chave.startsWith('tt-portal-') && chave !== CACHE_APLICATIVO)
          .map((chave) => caches.delete(chave))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requisicao = event.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  const moduloFirebase = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (url.origin !== self.location.origin && !moduloFirebase) return;

  // Os módulos do Firebase são armazenados depois do primeiro acesso online.
  // Isso mantém o portal carregável em conexões instáveis e permite que o
  // Firestore sincronize as alterações pendentes quando a internet retornar.
  if (moduloFirebase) {
    event.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_APLICATIVO).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(() => caches.match(requisicao))
    );
    return;
  }

  if (requisicao.mode === 'navigate') {
    event.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_APLICATIVO).then((cache) => cache.put('/index.html', copia));
          return resposta;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(requisicao)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE_APLICATIVO).then((cache) => cache.put(requisicao, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(requisicao, { ignoreSearch: true }))
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCkkF_9DyJTtkh-Mc340vLzIzsoFwbhE3o",
  authDomain: "site-tet-transportes.firebaseapp.com",
  projectId: "site-tet-transportes",
  storageBucket: "site-tet-transportes.firebasestorage.app",
  messagingSenderId: "55475140416",
  appId: "1:55475140416:web:3c95d3d3584b26007baca5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificação recebida: ', payload);

  const notificationTitle = payload.notification?.title || 'Novo Aviso - T&T Transportes';
  const notificationOptions = {
    body: payload.notification?.body || 'Confira o novo comunicado no aplicativo.',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {
      url: payload.data?.url || '/',
      secao: payload.data?.secao || null
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const secao = event.notification.data?.secao;
  const destino = event.notification.data?.url || (secao ? `/?secao=${secao}` : '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (janelas) => {
      const janelaAberta = janelas.find((janela) => new URL(janela.url).origin === self.location.origin);

      if (janelaAberta) {
        if (secao) janelaAberta.postMessage({ tipo: 'ABRIR_SECAO', secao });
        return janelaAberta.focus();
      }

      return clients.openWindow(destino);
    })
  );
});
