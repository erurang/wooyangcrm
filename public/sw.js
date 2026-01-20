// WOOYANG CRM Service Worker
const CACHE_NAME = 'wooyang-crm-v1';
const STATIC_CACHE = 'wooyang-crm-static-v1';
const DYNAMIC_CACHE = 'wooyang-crm-dynamic-v1';

// 정적 리소스 캐시 목록
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// API 경로는 캐시하지 않음
const API_ROUTES = ['/api/'];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 - Network First 전략 (API), Cache First 전략 (정적 리소스)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 네트워크 우선
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 정적 리소스는 캐시 우선
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML 페이지는 네트워크 우선, 실패 시 캐시
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 기타 요청은 네트워크 우선
  event.respondWith(networkFirst(request));
});

// Network First 전략
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Cache First 전략
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Network First with Offline Fallback
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    // 성공하면 캐시에 저장
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 네트워크 실패 시 캐시에서 찾기
    const cached = await caches.match(request);
    if (cached) return cached;

    // 캐시에도 없으면 오프라인 페이지
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;

    return new Response('오프라인 상태입니다.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'WOOYANG CRM',
    body: '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' },
    ],
    data: {
      url: data.url,
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);
  event.notification.close();

  // 닫기 버튼 클릭 시 아무것도 하지 않음
  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    (async () => {
      // DB 알림 읽음 처리 (notification_id가 있는 경우)
      if (notificationId) {
        try {
          await fetch(`/api/notifications/${notificationId}`, {
            method: 'PATCH',
          });
          console.log('[Service Worker] Notification marked as read:', notificationId);
        } catch (e) {
          console.error('[Service Worker] Failed to mark notification as read:', e);
        }
      }

      // 이미 열린 탭이 있으면 포커스하고 URL 이동
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.url !== url) {
            client.navigate(url);
          }
          return;
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});
