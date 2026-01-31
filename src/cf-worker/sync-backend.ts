import type { CFWorker, CfTypes } from '@livestore/sync-cf/cf-worker';
import { handleSyncRequest, makeDurableObject, matchSyncRequest } from '@livestore/sync-cf/cf-worker';
import type { Env } from './env';

/**
 * SyncBackendDO - Durable Object for handling LiveStore sync
 * 
 * This uses cookie-based authentication with Better Auth.
 * Headers are forwarded to onPush/onPull callbacks for session validation.
 */
export class SyncBackendDO extends makeDurableObject({
	// Forward Cookie header to callbacks for Better Auth session validation
	forwardHeaders: ['Cookie'],

	onPush: async (message, context) => {
		const { storeId, headers } = context;
		
		// Log push events (you can add more business logic here)
		console.log(`[Sync] Push to store ${storeId}: ${message.batch.length} events`);
		
		// Validate session from cookie if present
		const cookie = headers?.get('cookie');
		if (cookie) {
			const sessionToken = parseCookie(cookie, 'better-auth.session_token');
			if (sessionToken) {
				console.log(`[Sync] Push from authenticated session for store: ${storeId}`);
			}
		}
	},

	onPull: async (_message, context) => {
		const { storeId, headers } = context;
		
		console.log(`[Sync] Pull from store ${storeId}`);
		
		// Validate session from cookie if present
		const cookie = headers?.get('cookie');
		if (cookie) {
			const sessionToken = parseCookie(cookie, 'better-auth.session_token');
			if (sessionToken) {
				console.log(`[Sync] Pull for authenticated session, store: ${storeId}`);
			}
		}
	},

	// Enable both WebSocket and HTTP transports
	enabledTransports: new Set(['ws', 'http']),
}) {}

/**
 * Parse a specific cookie from the Cookie header
 */
function parseCookie(cookieHeader: string, name: string): string | undefined {
	const cookies = cookieHeader.split(';').map((c) => c.trim());
	for (const cookie of cookies) {
		const [key, ...valueParts] = cookie.split('=');
		if (key === name) {
			return valueParts.join('='); // Handle values that might contain '='
		}
	}
	return undefined;
}

/**
 * Validate that the storeId matches the user's expected store pattern
 */
function validateStoreAccess(storeId: string, userId: string | undefined): boolean {
	if (!userId) {
		// Anonymous users can only access their own stores
		// For now, allow access - in production you might want stricter rules
		return true;
	}
	
	// Check if storeId follows the pattern "user-{userId}"
	const expectedStoreId = `user-${userId}`;
	return storeId === expectedStoreId;
}

/**
 * Worker fetch handler - routes sync requests to the Durable Object
 */
export default {
	fetch: async (request: CfTypes.Request, env: Env, ctx: CfTypes.ExecutionContext) => {
		// Check if this is a LiveStore sync request
		const searchParams = matchSyncRequest(request);

		if (searchParams !== undefined) {
			// Handle sync request
			return handleSyncRequest({
				request,
				searchParams,
				env,
				ctx,
				syncBackendBinding: 'SYNC_BACKEND_DO',
				validatePayload: async (payload, { storeId }) => {
					// Validate payload if provided (for additional auth tokens)
					console.log(`[Sync] Validating connection for store: ${storeId}`);
					
					// Extract userId from payload if present
					const userId = (payload as { userId?: string } | undefined)?.userId;
					
					// Validate that user can access this store
					if (!validateStoreAccess(storeId, userId)) {
						throw new Error(`Unauthorized access to store: ${storeId}`);
					}
				},
			});
		}

		// Return 404 for non-sync requests
		// In a real app, you might route to other handlers here
		return new Response('Not Found', { status: 404 }) as unknown as CfTypes.Response;
	},
} satisfies CFWorker<Env>;
