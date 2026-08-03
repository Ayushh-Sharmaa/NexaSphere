/**
 * Firebase Cloud Messaging Service Worker for NexaSphere
 * Handles background push notifications when the app is closed/in background
 */

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "placeholder-api-key",
  authDomain: "nexasphere-placeholder.firebaseapp.com",
  projectId: "nexasphere-placeholder",
  storageBucket: "nexasphere-placeholder.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:placeholder"
});

// Retrieve an instance of Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'NexaSphere Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have received a new background update.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to redirect users
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const linkUrl = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    .catch(err => console.error(err))