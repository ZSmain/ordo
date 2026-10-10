import { createClient } from '@libsql/client';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLibSql } from 'drizzle-orm/libsql';
import * as schema from './schema';

export function getDb(db?: D1Database, databaseUrl?: string) {
	if (db) {
		return drizzleD1(db, { schema });
	}

	if (databaseUrl) {
		const client = createClient({ url: databaseUrl });
		return drizzleLibSql(client, { schema });
	}

	throw new Error('No database configuration found');
}

export type DrizzleClient = ReturnType<typeof getDb>;
