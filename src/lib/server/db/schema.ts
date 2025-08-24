import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';

export const category = sqliteTable("category", {
	id: integer("id").primaryKey(),
	name: text("name").notNull(),
	color: text("color").notNull(),
	icon: text("icon").notNull(),
});

export const activity = sqliteTable("activity", {
	id: integer("id").primaryKey(),
	name: text("name").notNull(),
	dailyGoal: integer("daily_goal"), // in minutes
	weeklyGoal: integer("weekly_goal"), // in minutes
	monthlyGoal: integer("monthly_goal"), // in minutes
	categoryId: integer("category_id")
		.notNull()
		.references(() => category.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});

// Category validation schemas
export const insertCategorySchema = createInsertSchema(category, {
	name: v.pipe(
		v.string("Category name must be a string"),
		v.minLength(1, "Category name is required"),
		v.maxLength(50, "Category name must be 50 characters or less")
	),
	color: v.pipe(
		v.string("Color must be a string"),
		v.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)")
	),
	icon: v.pipe(
		v.string("Icon must be a string"),
		v.minLength(1, "Icon is required"),
		v.maxLength(10, "Icon must be 10 characters or less")
	),
});

export const selectCategorySchema = createSelectSchema(category);

// Activity validation schemas
export const insertActivitySchema = createInsertSchema(activity, {
	name: v.pipe(
		v.string("Activity name must be a string"),
		v.minLength(1, "Activity name is required"),
		v.maxLength(100, "Activity name must be 100 characters or less")
	),
	dailyGoal: v.optional(
		v.pipe(
			v.number("Daily goal must be a number"),
			v.minValue(1, "Daily goal must be at least 1 minute")
		)
	),
	weeklyGoal: v.optional(
		v.pipe(
			v.number("Weekly goal must be a number"),
			v.minValue(1, "Weekly goal must be at least 1 minute")
		)
	),
	monthlyGoal: v.optional(
		v.pipe(
			v.number("Monthly goal must be a number"),
			v.minValue(1, "Monthly goal must be at least 1 minute")
		)
	),
	categoryId: v.pipe(
		v.number("Category ID must be a number"),
		v.minValue(1, "Category ID must be a valid category")
	),
});

export const selectActivitySchema = createSelectSchema(activity);

// Type exports
export type InsertCategory = v.InferInput<typeof insertCategorySchema>;
export type SelectCategory = v.InferOutput<typeof selectCategorySchema>;
export type InsertActivity = v.InferInput<typeof insertActivitySchema>;
export type SelectActivity = v.InferOutput<typeof selectActivitySchema>;

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});
