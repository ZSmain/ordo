import * as t from 'drizzle-orm/sqlite-core';
import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';
import { timestamps } from './columns.helpers';

export const user = table('user', {
	id: t.text('id').primaryKey(),
	name: t.text('name').notNull(),
	email: t.text('email').notNull().unique(),
	emailVerified: t
		.integer('email_verified', { mode: 'boolean' })
		.$defaultFn(() => false)
		.notNull(),
	image: t.text('image'),

	...timestamps
});

export const session = table('session', {
	id: t.text('id').primaryKey(),
	expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: t.text('token').notNull().unique(),
	createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: t.text('ip_address'),
	userAgent: t.text('user_agent'),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = table(
	'account',
	{
		id: t.text('id').primaryKey(),
		accountId: t.text('account_id').notNull(),
		// Required by better-auth 1.7: accounts are identified by (issuer, accountId).
		// Credential accounts use 'local:credential'; Google uses 'https://accounts.google.com'.
		issuer: t.text('issuer'),
		providerId: t.text('provider_id').notNull(),
		userId: t
			.text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: t.text('access_token'),
		refreshToken: t.text('refresh_token'),
		idToken: t.text('id_token'),
		accessTokenExpiresAt: t.integer('access_token_expires_at', {
			mode: 'timestamp'
		}),
		refreshTokenExpiresAt: t.integer('refresh_token_expires_at', {
			mode: 'timestamp'
		}),
		scope: t.text('scope'),
		password: t.text('password'),
		createdAt: t.integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: t.integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [t.uniqueIndex('account_issuer_account_id_unique').on(table.issuer, table.accountId)]
);

export const verification = table('verification', {
	id: t.text('id').primaryKey(),
	identifier: t.text('identifier').notNull(),
	value: t.text('value').notNull(),
	expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: t.integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: t.integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// User validation schemas
export const insertUserSchema = createInsertSchema(user, {
	id: v.pipe(v.string('User ID must be a string'), v.minLength(1, 'User ID is required')),
	name: v.pipe(
		v.string('Name must be a string'),
		v.minLength(1, 'Name is required'),
		v.maxLength(100, 'Name must be 100 characters or less')
	),
	email: v.pipe(v.string('Email must be a string'), v.email('Email must be a valid email address')),
	emailVerified: v.optional(v.boolean('Email verified must be a boolean')),
	image: v.optional(v.string('Image must be a string'))
});

export const selectUserSchema = createSelectSchema(user);

export type InsertUser = v.InferInput<typeof insertUserSchema>;
export type SelectUser = v.InferOutput<typeof selectUserSchema>;
