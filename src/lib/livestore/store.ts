import { makePersistedAdapter } from '@livestore/adapter-web';
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker';
import type { Store } from '@livestore/livestore';
import { createStore } from '@livestore/svelte';
import { browser } from '$app/environment';

import LiveStoreWorker from '../livestore.worker?worker';
import { schema } from './schema';

// Export the store type
export type OrdoStore = Store<typeof schema>;

// Store instances keyed by userId
const storeInstances = new Map<string, OrdoStore>();
const storePromises = new Map<string, Promise<OrdoStore>>();

/**
 * Get a user-specific storeId
 * Each user gets their own isolated LiveStore instance
 */
function getUserStoreId(userId: string): string {
	return `user-${userId}`;
}

async function initializeStore(userId: string): Promise<OrdoStore> {
	if (!browser) {
		throw new Error('LiveStore can only be initialized in the browser');
	}

	const storeId = getUserStoreId(userId);

	const adapterFactory = makePersistedAdapter({
		storage: { type: 'opfs' },
		worker: LiveStoreWorker,
		sharedWorker: LiveStoreSharedWorker
	});

	return await createStore<typeof schema>({
		adapter: adapterFactory,
		schema,
		storeId,
		// Pass userId in syncPayload for server-side validation
		syncPayload: {
			userId,
		},
	});
}

/**
 * Get or create a store for a specific user
 * Each user gets their own isolated store with data synced to their storeId
 */
export async function getStore(userId: string): Promise<OrdoStore> {
	if (!browser) {
		throw new Error('LiveStore can only be used in the browser');
	}

	if (!userId) {
		throw new Error('userId is required to get a store');
	}

	// Check if we already have an instance for this user
	const existingInstance = storeInstances.get(userId);
	if (existingInstance) {
		return existingInstance;
	}

	// Check if we're already initializing for this user
	let promise = storePromises.get(userId);
	if (!promise) {
		promise = initializeStore(userId);
		storePromises.set(userId, promise);
	}

	const store = await promise;
	storeInstances.set(userId, store);
	return store;
}

/**
 * Get an already initialized store for a user
 * Throws if the store hasn't been initialized yet
 */
export function getInitializedStore(userId: string): OrdoStore {
	const store = storeInstances.get(userId);
	if (!store) {
		throw new Error(`Store not initialized for user ${userId}. Call getStore(userId) first.`);
	}
	return store;
}

/**
 * Check if a store exists for a user
 */
export function hasStore(userId: string): boolean {
	return storeInstances.has(userId);
}

