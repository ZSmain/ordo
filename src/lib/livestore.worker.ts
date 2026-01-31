import { makeWorker } from '@livestore/adapter-web/worker';
import { makeWsSync } from '@livestore/sync-cf/client';

import { schema } from './livestore/schema';

// Get sync URL from environment or use default for local development
const syncUrl = (import.meta as unknown as { env: { VITE_SYNC_URL?: string } }).env.VITE_SYNC_URL 
	|| 'ws://localhost:8787';

makeWorker({ 
	schema,
	sync: {
		backend: makeWsSync({
			url: syncUrl,
		}),
	},
});
