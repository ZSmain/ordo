/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ /** @type {unknown} */ self;

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Assets to cache - the app itself and everything in static
const ASSETS = [...build, ...files];

// Set for O(1) pre-cached asset lookups during fetch
const ASSET_SET = new Set(ASSETS);

// Auth pages that should never be cached or served from cache
const AUTH_PATHS = new Set(['/login', '/signup']);

// Max number of runtime-cached entries (pages, data) kept before
// the oldest ones are evicted. Pre-cached assets are never evicted.
const MAX_RUNTIME_ENTRIES = 100;

sw.addEventListener('install', (event) => {
	// Create a new cache and add all files to it.
	// Tolerate individual failures so one bad asset can't block the update;
	// anything that failed will be fetched and cached on first use instead.
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		const results = await Promise.allSettled(ASSETS.map((asset) => cache.add(asset)));
		const failed = results.filter((result) => result.status === 'rejected');
		if (failed.length > 0) {
			console.warn(`[sw] Failed to pre-cache ${failed.length}/${ASSETS.length} assets`);
		}
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

// Evict the oldest runtime entries once the cache exceeds the cap
async function trimCache(maxEntries) {
	const cache = await caches.open(CACHE);
	const runtimeKeys = (await cache.keys()).filter((request) => {
		return !ASSET_SET.has(new URL(request.url).pathname);
	});

	for (let i = 0; i < runtimeKeys.length - maxEntries; i++) {
		await cache.delete(runtimeKeys[i]);
	}
}

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Ignore non-GET requests
	if (event.request.method !== 'GET') return;

	// Ignore cross-origin requests
	if (url.origin !== sw.location.origin) return;

	// Let the browser handle range requests (media streaming) natively
	if (event.request.headers.has('range')) return;

	// Don't cache auth routes, API routes, or remote functions
	if (
		AUTH_PATHS.has(url.pathname) ||
		url.pathname.startsWith('/api/') ||
		url.pathname.includes('.remote')
	) {
		return;
	}

	async function respond() {
		const cache = await caches.open(CACHE);
		const cachedResponse = await cache.match(event.request);

		// For assets that we've pre-cached, return from cache
		if (ASSET_SET.has(url.pathname) && cachedResponse) {
			return cachedResponse;
		}

		// For everything else, try network first
		try {
			const response = await fetch(event.request);

			// Cache successful responses for static assets
			if (response.status === 200) {
				event.waitUntil(
					cache.put(event.request, response.clone()).then(() => trimCache(MAX_RUNTIME_ENTRIES))
				);
			}

			return response;
		} catch {
			// If network fails and we have a cached version, use it
			if (cachedResponse) {
				return cachedResponse;
			}

			// Serve the offline page for navigation requests
			if (event.request.mode === 'navigate') {
				const offlineResponse = await cache.match('/offline.html');
				if (offlineResponse) return offlineResponse;
			}

			throw new Error('No cached response available');
		}
	}

	event.respondWith(respond());
});
