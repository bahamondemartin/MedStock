const CACHE_NAME = 'medstock-v3'
const STATIC_ASSETS = [
  '/inventory',
  '/shopping',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only cache GET requests for same-origin pages
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return
  // Don't cache API calls, Supabase, or auth-dependent routes
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) return
  const url = new URL(event.request.url)
  const authRoutes = ['/', '/home', '/login', '/auth']
  if (authRoutes.some((r) => url.pathname === r || url.pathname.startsWith(r + '/'))) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return res
      })
      return cached || networkFetch
    })
  )
})
