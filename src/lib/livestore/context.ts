import type { Store } from '@livestore/livestore';
import type { schema } from './schema';

export type OrdoStoreType = Store<typeof schema>;

// These functions are populated by LiveStoreProvider.svelte
let _storeInstance: OrdoStoreType | null = null;
let _currentUserId: string | null = null;

/**
 * Get the current LiveStore instance
 * Must be called within a LiveStoreProvider after initialization
 */
export function useLiveStore(): OrdoStoreType {
	if (!_storeInstance) {
		throw new Error('useLiveStore must be called within a LiveStoreProvider after store is initialized');
	}
	return _storeInstance;
}

/**
 * Get the current authenticated user's ID
 * Must be called within a LiveStoreProvider after initialization
 */
export function getCurrentUserId(): string {
	if (!_currentUserId) {
		throw new Error('getCurrentUserId must be called within a LiveStoreProvider after store is initialized');
	}
	return _currentUserId;
}

/**
 * Internal: Set the store instance (called by LiveStoreProvider)
 */
export function _setStoreInstance(store: OrdoStoreType, userId: string): void {
	_storeInstance = store;
	_currentUserId = userId;
}

/**
 * Check if a store is currently initialized
 */
export function isStoreInitialized(): boolean {
	return _storeInstance !== null;
}
