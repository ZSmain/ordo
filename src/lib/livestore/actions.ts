import { nanoid } from '@livestore/livestore';
import type { Store } from '@livestore/livestore';

import { events, type schema } from './schema';

type OrdoStore = Store<typeof schema>;

// Category actions
export const categoryActions = {
	create: (
		store: OrdoStore,
		data: { name: string; color: string; icon: string; userId: string }
	) => {
		const id = nanoid();
		store.commit(events.categoryCreated({ id, ...data }));
		return id;
	},

	update: (
		store: OrdoStore,
		id: string,
		data: { name?: string; color?: string; icon?: string }
	) => {
		store.commit(events.categoryUpdated({ id, ...data }));
	},

	delete: (store: OrdoStore, id: string) => {
		store.commit(events.categoryDeleted({ id, deletedAt: new Date() }));
	}
};

// Activity actions
export const activityActions = {
	create: (
		store: OrdoStore,
		data: {
			name: string;
			icon: string;
			userId: string;
			categoryIds: string[];
			dailyGoal?: number | null;
			weeklyGoal?: number | null;
			monthlyGoal?: number | null;
		}
	) => {
		const id = nanoid();

		// Create the activity
		store.commit(
			events.activityCreated({
				id,
				name: data.name,
				icon: data.icon,
				userId: data.userId,
				dailyGoal: data.dailyGoal ?? null,
				weeklyGoal: data.weeklyGoal ?? null,
				monthlyGoal: data.monthlyGoal ?? null,
				categoryIds: data.categoryIds
			})
		);

		// Create activity-category links
		for (const categoryId of data.categoryIds) {
			const linkId = nanoid();
			store.commit(events.activityCategoryLinked({ id: linkId, activityId: id, categoryId }));
		}

		return id;
	},

	update: (
		store: OrdoStore,
		id: string,
		data: {
			name?: string;
			icon?: string;
			dailyGoal?: number | null;
			weeklyGoal?: number | null;
			monthlyGoal?: number | null;
		}
	) => {
		store.commit(events.activityUpdated({ id, ...data }));
	},

	archive: (store: OrdoStore, id: string) => {
		store.commit(events.activityArchived({ id }));
	},

	unarchive: (store: OrdoStore, id: string) => {
		store.commit(events.activityUnarchived({ id }));
	},

	delete: (store: OrdoStore, id: string) => {
		store.commit(events.activityDeleted({ id, deletedAt: new Date() }));
	},

	// Update category links for an activity (simplified - gets current links via query)
	updateCategories: (
		store: OrdoStore,
		activityId: string,
		newCategoryIds: string[]
	) => {
		// For simplicity, we'll just commit a batch of events
		// First delete all existing links for this activity, then create new ones
		// In a production app, you might want to be smarter about this
		
		// This requires querying current links - but for now, we'll emit events
		// that the materializer can handle
		for (const categoryId of newCategoryIds) {
			const linkId = nanoid();
			store.commit(events.activityCategoryLinked({ id: linkId, activityId, categoryId }));
		}
	}
};

// Time session actions
export const timeSessionActions = {
	start: (store: OrdoStore, data: { activityId: string; userId: string }) => {
		const id = nanoid();
		store.commit(
			events.timeSessionStarted({
				id,
				activityId: data.activityId,
				userId: data.userId,
				startedAt: new Date()
			})
		);
		return id;
	},

	stop: (store: OrdoStore, id: string, startedAt: Date) => {
		const stoppedAt = new Date();
		const duration = Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000);
		store.commit(events.timeSessionStopped({ id, stoppedAt, duration }));
	},

	update: (
		store: OrdoStore,
		id: string,
		data: {
			startedAt?: Date;
			stoppedAt?: Date;
			duration?: number;
			notes?: string | null;
		}
	) => {
		store.commit(events.timeSessionUpdated({ id, ...data }));
	},

	create: (
		store: OrdoStore,
		data: {
			activityId: string;
			userId: string;
			startedAt: Date;
			stoppedAt: Date;
			notes?: string | null;
		}
	) => {
		const id = nanoid();
		const duration = Math.floor((data.stoppedAt.getTime() - data.startedAt.getTime()) / 1000);
		store.commit(
			events.timeSessionCreated({
				id,
				activityId: data.activityId,
				userId: data.userId,
				startedAt: data.startedAt,
				stoppedAt: data.stoppedAt,
				duration,
				notes: data.notes ?? null
			})
		);
		return id;
	},

	delete: (store: OrdoStore, id: string) => {
		store.commit(events.timeSessionDeleted({ id, deletedAt: new Date() }));
	}
};

// UI State actions
export const uiStateActions = {
	setSelectedCategories: (store: OrdoStore, categoryIds: readonly string[]) => {
		store.commit(events.uiStateSet({ selectedCategoryIds: categoryIds }));
	},

	setFilterMode: (store: OrdoStore, mode: 'OR' | 'AND') => {
		store.commit(events.uiStateSet({ filterMode: mode }));
	},

	setTimerActivity: (store: OrdoStore, activityId: string | null, startedAt: Date | null) => {
		store.commit(events.uiStateSet({ timerActivityId: activityId, timerStartedAt: startedAt }));
	}
};
