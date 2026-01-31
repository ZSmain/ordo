import type { CfTypes, SyncBackendRpcInterface } from '@livestore/sync-cf/cf-worker';

export interface Env {
	SYNC_BACKEND_DO: CfTypes.DurableObjectNamespace<SyncBackendRpcInterface>;
	// D1 database for Better Auth session validation
	ordo_db: D1Database;
}
