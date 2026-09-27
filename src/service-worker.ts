/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ /** @type {unknown} */ self;

const STATIC_CACHE = `cache-${version}-static`;
const RUNTIME_CACHE = `cache-${version}-runtime`;

const ASSETS = [...build, ...files];

const ASSET_SET = new Set(ASSETS);

const AUTH_PATHS = new Set(['/login', '/signup']);

const MAX_RUNTIME_ENTRIES = 100;

sw.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(STATIC_CACHE);
		const results = await Promise.allSettled(ASSETS.map((asset) => cache.add(asset)));
		const failed = results.filter((result) => result.status === 'rejected');
		if (failed.length > 0) {
			console.warn(`[sw] Failed to pre-cache ${failed.length}/${ASSETS.length} assets`);
		}
	}

	event.waitUntil(addFilesToCache().then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) await caches.delete(key);
		}
		if ('navigationPreload' in sw.registration) {
			try {
				await sw.registration.navigationPreload.enable();
			} catch {
				// Navigation preload is a progressive enhancement
			}
		}
	}

	event.waitUntil(deleteOldCaches().then(() => sw.clients.claim()));
});

async function trimCache() {
	const cache = await caches.open(RUNTIME_CACHE);
	const keys = await cache.keys();
	if (keys.length <= MAX_RUNTIME_ENTRIES) return;

	for (let i = 0; i < keys.length - MAX_RUNTIME_ENTRIES; i++) {
		await cache.delete(keys[i]);
	}
}

function isCacheableResponse(response: unknown): response is Response {
	return (
		response instanceof Response &&
		response.status === 200 &&
		response.type === 'basic' &&
		!response.headers.get('cache-control')?.includes('no-store')
	);
}

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	if (event.request.method !== 'GET') return;

	if (url.origin !== sw.location.origin) return;

	if (event.request.headers.has('range')) return;

	if (
		AUTH_PATHS.has(url.pathname) ||
		url.pathname.startsWith('/api/') ||
		url.pathname.includes('.remote') ||
		url.searchParams.has('__data') ||
		url.searchParams.has('x-sveltekit-invalidated')
	) {
		return;
	}

	// Immutable build output + static files: cache-first, never revalidate in SW.
	// Filenames are content-hashed, so a new deploy gets a new cache.
	if (ASSET_SET.has(url.pathname)) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(STATIC_CACHE);
				const cachedResponse = await cache.match(event.request);
				if (cachedResponse) return cachedResponse;
				try {
					const response = await fetch(event.request);
					if (isCacheableResponse(response)) {
						event.waitUntil(cache.put(event.request, response.clone()));
					}
					return response;
				} catch {
					throw new Error('No cached response available');
				}
			})()
		);
		return;
	}

	// Pages and other same-origin GETs: stale-while-revalidate.
	// Serve the cached shell instantly, refresh it in the background.
	event.respondWith(
		(async () => {
			const cache = await caches.open(RUNTIME_CACHE);
			const cachedResponse = await cache.match(event.request);

			const networkPromise = (async () => {
				try {
					const preload =
						event.request.mode === 'navigate'
							? await event.preloadResponse.catch(() => undefined)
							: undefined;
					const response = preload ?? (await fetch(event.request));
					if (isCacheableResponse(response)) {
						await cache.put(event.request, response.clone());
						await trimCache();
					}
					return response;
				} catch {
					return undefined;
				}
			})();

			if (cachedResponse) {
				event.waitUntil(networkPromise);
				return cachedResponse;
			}

			const networkResponse = await networkPromise;
			if (networkResponse) return networkResponse;

			if (event.request.mode === 'navigate') {
				const staticCache = await caches.open(STATIC_CACHE);
				const offlineResponse = await staticCache.match('/offline.html');
				if (offlineResponse) return offlineResponse;
			}

			throw new Error('No cached response available');
		})()
	);
});
