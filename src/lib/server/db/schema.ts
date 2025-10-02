import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';

export const category = sqliteTable('category', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	color: text('color').notNull(),
	icon: text('icon').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull()
});

export const activity = sqliteTable('activity', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	icon: text('icon').notNull(),
	dailyGoal: integer('daily_goal'), // in minutes
	weeklyGoal: integer('weekly_goal'), // in minutes
	monthlyGoal: integer('monthly_goal'), // in minutes
	archived: integer('archived', { mode: 'boolean' }).default(false).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull()
});

// Junction table for many-to-many relationship between activities and categories
export const activityCategory = sqliteTable(
	'activity_category',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		activityId: integer('activity_id')
			.notNull()
			.references(() => activity.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => category.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => ({
		uniqueActivityCategory: unique().on(table.activityId, table.categoryId)
	})
);

export const timeSession = sqliteTable('time_session', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	activityId: integer('activity_id')
		.notNull()
		.references(() => activity.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	startedAt: integer('started_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	stoppedAt: integer('stopped_at', { mode: 'timestamp' }),
	duration: integer('duration'), // in seconds, calculated when session ends
	isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(), // tracks if timer is currently running
	notes: text('notes'), // optional notes for the time session
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull()
});

// Category validation schemas
export const insertCategorySchema = createInsertSchema(category, {
	name: v.pipe(
		v.string('Category name must be a string'),
		v.minLength(1, 'Category name is required'),
		v.maxLength(50, 'Category name must be 50 characters or less')
	),
	color: v.pipe(
		v.string('Color must be a string'),
		v.regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
	),
	icon: v.pipe(
		v.string('Icon must be a string'),
		v.minLength(1, 'Icon is required'),
		v.maxLength(10, 'Icon must be 10 characters or less')
	),
	userId: v.pipe(v.string('User ID must be a string'), v.minLength(1, 'User ID is required'))
});

export const selectCategorySchema = createSelectSchema(category);

// Activity validation schemas
export const insertActivitySchema = createInsertSchema(activity, {
	name: v.pipe(
		v.string('Activity name must be a string'),
		v.minLength(1, 'Activity name is required'),
		v.maxLength(100, 'Activity name must be 100 characters or less')
	),
	icon: v.pipe(
		v.string('Icon must be a string'),
		v.minLength(1, 'Icon is required'),
		v.maxLength(10, 'Icon must be 10 characters or less')
	),
	dailyGoal: v.optional(
		v.pipe(
			v.number('Daily goal must be a number'),
			v.minValue(1, 'Daily goal must be at least 1 minute')
		)
	),
	weeklyGoal: v.optional(
		v.pipe(
			v.number('Weekly goal must be a number'),
			v.minValue(1, 'Weekly goal must be at least 1 minute')
		)
	),
	monthlyGoal: v.optional(
		v.pipe(
			v.number('Monthly goal must be a number'),
			v.minValue(1, 'Monthly goal must be at least 1 minute')
		)
	),

	archived: v.optional(v.boolean('Archived must be a boolean')),
	userId: v.pipe(v.string('User ID must be a string'), v.minLength(1, 'User ID is required'))
});

export const selectActivitySchema = createSelectSchema(activity);

// Activity creation with categories validation schema
export const insertActivityWithCategoriesSchema = v.object({
	...insertActivitySchema.entries,
	categoryIds: v.pipe(
		v.array(v.number('Category ID must be a number')),
		v.minLength(1, 'At least one category is required')
	)
});

// Time Session validation schemas
export const insertTimeSessionSchema = createInsertSchema(timeSession, {
	activityId: v.pipe(
		v.number('Activity ID must be a number'),
		v.minValue(1, 'Activity ID must be a valid activity')
	),
	userId: v.pipe(v.string('User ID must be a string'), v.minLength(1, 'User ID is required')),
	duration: v.optional(
		v.pipe(
			v.number('Duration must be a number'),
			v.minValue(1, 'Duration must be at least 1 second')
		)
	),
	notes: v.optional(
		v.pipe(
			v.string('Notes must be a string'),
			v.maxLength(500, 'Notes must be 500 characters or less')
		)
	)
});

export const selectTimeSessionSchema = createSelectSchema(timeSession);

// Activity-Category junction table validation schemas
export const insertActivityCategorySchema = createInsertSchema(activityCategory, {
	activityId: v.pipe(
		v.number('Activity ID must be a number'),
		v.minValue(1, 'Activity ID must be a valid activity')
	),
	categoryId: v.pipe(
		v.number('Category ID must be a number'),
		v.minValue(1, 'Category ID must be a valid category')
	)
});

export const selectActivityCategorySchema = createSelectSchema(activityCategory);

// Type exports
export type InsertCategory = v.InferInput<typeof insertCategorySchema>;
export type SelectCategory = v.InferOutput<typeof selectCategorySchema>;
export type InsertActivity = v.InferInput<typeof insertActivitySchema>;
export type SelectActivity = v.InferOutput<typeof selectActivitySchema>;
export type InsertActivityWithCategories = v.InferInput<typeof insertActivityWithCategoriesSchema>;
export type InsertTimeSession = v.InferInput<typeof insertTimeSessionSchema>;
export type SelectTimeSession = v.InferOutput<typeof selectTimeSessionSchema>;
export type InsertActivityCategory = v.InferInput<typeof insertActivityCategorySchema>;
export type SelectActivityCategory = v.InferOutput<typeof selectActivityCategorySchema>;

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' })
		.$defaultFn(() => false)
		.notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', {
		mode: 'timestamp'
	}),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', {
		mode: 'timestamp'
	}),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
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
