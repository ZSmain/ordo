/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ /** @type {unknown} */ self;

const CACHE = `cache-${version}`;

const ASSETS = [...build, ...files];

const ASSET_SET = new Set(ASSETS);

const AUTH_PATHS = new Set(['/login', '/signup']);

const MAX_RUNTIME_ENTRIES = 100;

sw.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		const results = await Promise.allSettled(ASSETS.map((asset) => cache.add(asset)));
		const failed = results.filter((result) => result.status === 'rejected');
		if (failed.length > 0) {
			console.warn(`[sw] Failed to pre-cache ${failed.length}/${ASSETS.length} assets`);
		}
	}

	event.waitUntil(addFilesToCache());

	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());

	sw.clients.claim();
});

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

	if (event.request.method !== 'GET') return;

	if (url.origin !== sw.location.origin) return;

	if (event.request.headers.has('range')) return;

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

		if (ASSET_SET.has(url.pathname) && cachedResponse) {
			return cachedResponse;
		}

		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				event.waitUntil(
					cache.put(event.request, response.clone()).then(() => trimCache(MAX_RUNTIME_ENTRIES))
				);
			}

			return response;
		} catch {
			if (cachedResponse) {
				return cachedResponse;
			}

			if (event.request.mode === 'navigate') {
				const offlineResponse = await cache.match('/offline.html');
				if (offlineResponse) return offlineResponse;
			}

			throw new Error('No cached response available');
		}
	}

	event.respondWith(respond());
});
