// Service Worker for SR Logística PWA & Background Dispatch Notifications
const CACHE_NAME = 'sr-logistica-v1.0.5';

const STATIC_PRECACHE = [
  '/',
  '/welcome',
  '/login',
  '/cadastro',
  '/mapa',
  '/corridas',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/logo.svg',
  '/logo-icon.svg',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png'
];

// Estado do monitor em segundo plano
let bgConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  driverId: '',
  isActive: false
};
let lastNotifiedRideId = '';
let bgIntervalId = null;

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

// Activate Event - purge all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip API, Supabase, and WebSocket routes
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/auth/v1')
  ) {
    return;
  }

  // Handle static assets with Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Função de polling em segundo plano direto na REST API do Supabase
async function pollSupabaseForRides() {
  if (!bgConfig.isActive || !bgConfig.supabaseUrl || !bgConfig.supabaseAnonKey) {
    return;
  }

  const headers = {
    apikey: bgConfig.supabaseAnonKey,
    Authorization: `Bearer ${bgConfig.supabaseAnonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };

  try {
    // 1. Consulta tabela 'rides'
    const ridesUrl = `${bgConfig.supabaseUrl}/rest/v1/rides?status=in.(PENDING,BUSCANDO,OPEN,SEARCHING)&order=created_at.desc&limit=1`;
    const resRides = await fetch(ridesUrl, { headers }).catch(() => null);

    let latestRide = null;
    if (resRides && resRides.ok) {
      const data = await resRides.json();
      if (Array.isArray(data) && data.length > 0) {
        latestRide = data[0];
      }
    }

    // 2. Se não encontrou em 'rides', tenta em 'corridas'
    if (!latestRide) {
      const corridasUrl = `${bgConfig.supabaseUrl}/rest/v1/corridas?status=in.(PENDING,BUSCANDO,OPEN,SOLICITADA)&order=created_at.desc&limit=1`;
      const resCorridas = await fetch(corridasUrl, { headers }).catch(() => null);
      if (resCorridas && resCorridas.ok) {
        const data = await resCorridas.json();
        if (Array.isArray(data) && data.length > 0) {
          latestRide = data[0];
        }
      }
    }

    if (latestRide && latestRide.id && latestRide.id !== lastNotifiedRideId) {
      lastNotifiedRideId = latestRide.id;

      const fare = latestRide.fare_amount || latestRide.valor || latestRide.price || 25.0;
      const passenger = latestRide.passenger_name || latestRide.cliente_nome || latestRide.user_name || 'Passageiro';
      const pickup = latestRide.pickup_address || latestRide.origem_endereco || latestRide.origem || 'Embarque Próximo';
      const dropoff = latestRide.dropoff_address || latestRide.destino_endereco || latestRide.destino || 'Destino';

      const title = `🚖 Nova Corrida Disponível: R$ ${Number(fare).toFixed(2)}`;
      const body = `👤 ${passenger}\n📍 ${pickup}\n🏁 ${dropoff}`;

      await self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `ride-offer-${latestRide.id}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [600, 200, 600, 200, 600, 200, 600],
        data: {
          url: `/corridas/${latestRide.id}?openRide=true`,
          rideId: latestRide.id,
          rideData: latestRide
        },
        actions: [
          { action: 'open_pop_up', title: '📲 ABRIR NO APLICATIVO' }
        ]
      });

      // Notifica todos os clientes abertos/em segundo plano
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: 'NEW_RIDE_OFFER_RECEIVED',
          ride: latestRide
        });
      }
    }
  } catch (err) {
    console.warn('[SW] Erro no polling de segundo plano:', err);
  }
}

function startBackgroundLoop() {
  if (bgIntervalId) {
    clearInterval(bgIntervalId);
  }
  bgIntervalId = setInterval(pollSupabaseForRides, 3000);
}

function stopBackgroundLoop() {
  if (bgIntervalId) {
    clearInterval(bgIntervalId);
    bgIntervalId = null;
  }
}

// Mensagens internas do frontend para o Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'ENABLE_BACKGROUND_DISPATCH_SYNC') {
    bgConfig = {
      supabaseUrl: event.data.supabaseUrl || bgConfig.supabaseUrl,
      supabaseAnonKey: event.data.supabaseAnonKey || bgConfig.supabaseAnonKey,
      driverId: event.data.driverId || bgConfig.driverId,
      isActive: true
    };
    startBackgroundLoop();
  } else if (event.data.type === 'DISABLE_BACKGROUND_DISPATCH_SYNC') {
    bgConfig.isActive = false;
    stopBackgroundLoop();
  } else if (event.data.type === 'SHOW_RIDE_NOTIFICATION' || event.data.type === 'SHOW_CANCELLATION_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Push notification listener (ready for background push events)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '🚖 Nova Corrida Disponível - SR Logística';
    const options = {
      body: data.body || 'Você tem uma nova solicitação de corrida!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'new-ride-offer',
      renotify: true,
      requireInteraction: true,
      vibrate: [600, 200, 600, 200, 600, 200, 600],
      data: data.data || { url: '/' },
      actions: [
        { action: 'open_pop_up', title: '📲 ABRIR NO APLICATIVO' }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Push event error:', err);
  }
});

// Notification click listener - Wakes up and focuses/opens the app window in full pop-up mode!
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/corridas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
