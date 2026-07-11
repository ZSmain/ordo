import * as t from 'drizzle-orm/sqlite-core';
import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';
import { user } from './auth.schema';
import { timestamps } from './columns.helpers';

export const category = table('category', {
	id: t.integer('id').primaryKey({ autoIncrement: true }),
	name: t.text('name').notNull(),
	color: t.text('color').notNull(),
	icon: t.text('icon').notNull(),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	...timestamps
});

export const activity = table('activity', {
	id: t.integer('id').primaryKey({ autoIncrement: true }),
	name: t.text('name').notNull(),
	icon: t.text('icon').notNull(),
	dailyGoal: t.integer('daily_goal'), // in minutes
	weeklyGoal: t.integer('weekly_goal'), // in minutes
	monthlyGoal: t.integer('monthly_goal'), // in minutes
	favorite: t.integer('favorite', { mode: 'boolean' }).default(false).notNull(),
	archived: t.integer('archived', { mode: 'boolean' }).default(false).notNull(),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	...timestamps
});

// Junction table for many-to-many relationship between activities and categories
export const activityCategory = table(
	'activity_category',
	{
		id: t.integer('id').primaryKey({ autoIncrement: true }),
		activityId: t
			.integer('activity_id')
			.notNull()
			.references(() => activity.id, { onDelete: 'cascade' }),
		categoryId: t
			.integer('category_id')
			.notNull()
			.references(() => category.id, { onDelete: 'cascade' }),

		...timestamps
	},
	(table) => [t.unique().on(table.activityId, table.categoryId)]
);

export const timeSession = table('time_session', {
	id: t.integer('id').primaryKey({ autoIncrement: true }),
	activityId: t
		.integer('activity_id')
		.notNull()
		.references(() => activity.id, { onDelete: 'cascade' }),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	startedAt: t
		.integer('started_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	stoppedAt: t.integer('stopped_at', { mode: 'timestamp' }),
	duration: t.integer('duration'), // in seconds, calculated when session ends
	isActive: t.integer('is_active', { mode: 'boolean' }).default(true).notNull(), // tracks if timer is currently running
	notes: t.text('notes'), // optional notes for the time session

	...timestamps
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
	favorite: v.optional(v.boolean('Favorite must be a boolean')),
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

export * from './auth.schema';
