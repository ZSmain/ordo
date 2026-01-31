import { queryDb } from '@livestore/livestore';

import { tables } from './schema';

// UI State query
export const uiState$ = queryDb(tables.uiState.get(), { label: 'uiState' });

// Get all categories for a user (excluding deleted)
export const categoriesForUser$ = (userId: string) =>
	queryDb(tables.categories.where({ userId, deletedAt: null }), {
		label: `categories-${userId}`
	});

// Get all activities for a user (excluding deleted and archived)
export const activitiesForUser$ = (userId: string) =>
	queryDb(tables.activities.where({ userId, deletedAt: null, archived: false }), {
		label: `activities-${userId}`
	});

// Get all activities for a user (including archived, excluding deleted)
export const allActivitiesForUser$ = (userId: string) =>
	queryDb(tables.activities.where({ userId, deletedAt: null }), {
		label: `allActivities-${userId}`
	});

// Get all activity-category links (excluding deleted)
export const activityCategoryLinks$ = queryDb(
	tables.activityCategories.where({ deletedAt: null }),
	{
		label: 'activityCategoryLinks'
	}
);

// Get active time session for a user
export const activeSession$ = (userId: string) =>
	queryDb(tables.timeSessions.where({ userId, isActive: true, deletedAt: null }), {
		label: `activeSession-${userId}`
	});

// Get all time sessions for a user (excluding deleted)
export const timeSessionsForUser$ = (userId: string) =>
	queryDb(tables.timeSessions.where({ userId, deletedAt: null }), {
		label: `timeSessions-${userId}`
	});

// Get completed time sessions for a user (excludes active sessions)
export const completedSessionsForUser$ = (userId: string) =>
	queryDb(tables.timeSessions.where({ userId, isActive: false, deletedAt: null }), {
		label: `completedSessions-${userId}`
	});
