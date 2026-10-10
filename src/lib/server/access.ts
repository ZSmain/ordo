import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import {
	activity,
	category,
	timeSession,
	type SelectActivity,
	type SelectCategory,
	type SelectTimeSession
} from './db/schema.js';

type Db = App.Locals['db'];

export async function requireOwnedActivity(
	db: Db,
	userId: string,
	activityId: number
): Promise<SelectActivity> {
	const row = await db
		.select()
		.from(activity)
		.where(and(eq(activity.id, activityId), eq(activity.userId, userId)))
		.get();

	if (!row) {
		error(404, 'Activity not found');
	}

	return row;
}

export async function requireOwnedCategory(
	db: Db,
	userId: string,
	categoryId: number
): Promise<SelectCategory> {
	const row = await db
		.select()
		.from(category)
		.where(and(eq(category.id, categoryId), eq(category.userId, userId)))
		.get();

	if (!row) {
		error(404, 'Category not found');
	}

	return row;
}

export async function requireOwnedCategories(
	db: Db,
	userId: string,
	categoryIds: number[]
): Promise<number[]> {
	if (categoryIds.length === 0) {
		return [];
	}

	const uniqueCategoryIds = [...new Set(categoryIds)];
	const existingCategories = await db
		.select({ id: category.id })
		.from(category)
		.where(and(eq(category.userId, userId), inArray(category.id, uniqueCategoryIds)))
		.all();

	if (existingCategories.length !== uniqueCategoryIds.length) {
		error(404, 'One or more categories were not found');
	}

	return uniqueCategoryIds;
}

export async function requireOwnedSession(
	db: Db,
	userId: string,
	sessionId: number
): Promise<SelectTimeSession> {
	const row = await db
		.select()
		.from(timeSession)
		.where(and(eq(timeSession.id, sessionId), eq(timeSession.userId, userId)))
		.get();

	if (!row) {
		error(404, 'Session not found');
	}

	return row;
}
