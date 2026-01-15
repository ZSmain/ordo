/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Assets to cache - the app itself and everything in static
const ASSETS = [
    ...build,
    ...files
];

sw.addEventListener('install', (event) => {
    // Create a new cache and add all files to it
    async function addFilesToCache() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
    }

    event.waitUntil(addFilesToCache());

    // Skip waiting to activate immediately (silent update)
    sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
    // Remove previous cached data from disk
    async function deleteOldCaches() {
        for (const key of await caches.keys()) {
            if (key !== CACHE) await caches.delete(key);
        }
    }

    event.waitUntil(deleteOldCaches());

    // Take control of all clients immediately
    sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore non-GET requests
    if (event.request.method !== 'GET') return;

    // Don't cache auth routes, API routes, or remote functions
    if (
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/signup') ||
        url.pathname.startsWith('/api/') ||
        url.pathname.includes('.remote')
    ) {
        return;
    }

    async function respond() {
        const cache = await caches.open(CACHE);
        const cachedResponse = await cache.match(event.request);

        // For assets that we've pre-cached, return from cache
        if (ASSETS.includes(url.pathname)) {
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // For everything else, try network first
        try {
            const response = await fetch(event.request);

            // Cache successful responses for static assets
            const isNotExtension = url.hostname === self.location.hostname;
            const isSuccess = response.status === 200;

            if (isNotExtension && isSuccess) {
                cache.put(event.request, response.clone());
            }

            return response;
        } catch {
            // If network fails and we have a cached version, use it
            if (cachedResponse) {
                return cachedResponse;
            }

            // Return a basic offline response for navigation requests
            if (event.request.mode === 'navigate') {
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/html' }
                });
            }

            throw new Error('No cached response available');
        }
    }

    event.respondWith(respond());
});
