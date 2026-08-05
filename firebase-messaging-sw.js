// firebase-messaging-sw.js
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
    icon: '/logo.png',
    badge: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});