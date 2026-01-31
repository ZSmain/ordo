import { Events, makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore';

// Define tables for the time tracking app
export const tables = {
	// Categories table
	categories: State.SQLite.table({
		name: 'categories',
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			name: State.SQLite.text({ default: '' }),
			color: State.SQLite.text({ default: '#3B82F6' }),
			icon: State.SQLite.text({ default: '📁' }),
			userId: State.SQLite.text({ default: '' }),
			deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
		}
	}),

	// Activities table
	activities: State.SQLite.table({
		name: 'activities',
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			name: State.SQLite.text({ default: '' }),
			icon: State.SQLite.text({ default: '🎯' }),
			dailyGoal: State.SQLite.integer({ nullable: true }),
			weeklyGoal: State.SQLite.integer({ nullable: true }),
			monthlyGoal: State.SQLite.integer({ nullable: true }),
			archived: State.SQLite.boolean({ default: false }),
			userId: State.SQLite.text({ default: '' }),
			deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
		}
	}),

	// Junction table for many-to-many relationship between activities and categories
	activityCategories: State.SQLite.table({
		name: 'activity_categories',
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			activityId: State.SQLite.text({ default: '' }),
			categoryId: State.SQLite.text({ default: '' }),
			deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
		}
	}),

	// Time sessions table
	timeSessions: State.SQLite.table({
		name: 'time_sessions',
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			activityId: State.SQLite.text({ default: '' }),
			userId: State.SQLite.text({ default: '' }),
			startedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			stoppedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
			duration: State.SQLite.integer({ nullable: true }),
			isActive: State.SQLite.boolean({ default: true }),
			notes: State.SQLite.text({ nullable: true }),
			deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
		}
	}),

	// Client-only UI state document
	uiState: State.SQLite.clientDocument({
		name: 'uiState',
		schema: Schema.Struct({
			selectedCategoryIds: Schema.Array(Schema.String),
			filterMode: Schema.Literal('OR', 'AND'),
			timerActivityId: Schema.NullOr(Schema.String),
			timerStartedAt: Schema.NullOr(Schema.DateFromNumber)
		}),
		default: {
			id: SessionIdSymbol,
			value: {
				selectedCategoryIds: [],
				filterMode: 'OR',
				timerActivityId: null,
				timerStartedAt: null
			}
		}
	})
};

// Events for category operations
const categoryEvents = {
	categoryCreated: Events.synced({
		name: 'v1.CategoryCreated',
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			color: Schema.String,
			icon: Schema.String,
			userId: Schema.String
		})
	}),
	categoryUpdated: Events.synced({
		name: 'v1.CategoryUpdated',
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.optional(Schema.String),
			color: Schema.optional(Schema.String),
			icon: Schema.optional(Schema.String)
		})
	}),
	categoryDeleted: Events.synced({
		name: 'v1.CategoryDeleted',
		schema: Schema.Struct({
			id: Schema.String,
			deletedAt: Schema.Date
		})
	})
};

// Events for activity operations
const activityEvents = {
	activityCreated: Events.synced({
		name: 'v1.ActivityCreated',
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			icon: Schema.String,
			dailyGoal: Schema.NullOr(Schema.Number),
			weeklyGoal: Schema.NullOr(Schema.Number),
			monthlyGoal: Schema.NullOr(Schema.Number),
			userId: Schema.String,
			categoryIds: Schema.Array(Schema.String)
		})
	}),
	activityUpdated: Events.synced({
		name: 'v1.ActivityUpdated',
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.optional(Schema.String),
			icon: Schema.optional(Schema.String),
			dailyGoal: Schema.optional(Schema.NullOr(Schema.Number)),
			weeklyGoal: Schema.optional(Schema.NullOr(Schema.Number)),
			monthlyGoal: Schema.optional(Schema.NullOr(Schema.Number))
		})
	}),
	activityArchived: Events.synced({
		name: 'v1.ActivityArchived',
		schema: Schema.Struct({
			id: Schema.String
		})
	}),
	activityUnarchived: Events.synced({
		name: 'v1.ActivityUnarchived',
		schema: Schema.Struct({
			id: Schema.String
		})
	}),
	activityDeleted: Events.synced({
		name: 'v1.ActivityDeleted',
		schema: Schema.Struct({
			id: Schema.String,
			deletedAt: Schema.Date
		})
	})
};

// Events for activity-category relationship
const activityCategoryEvents = {
	activityCategoryLinked: Events.synced({
		name: 'v1.ActivityCategoryLinked',
		schema: Schema.Struct({
			id: Schema.String,
			activityId: Schema.String,
			categoryId: Schema.String
		})
	}),
	activityCategoryUnlinked: Events.synced({
		name: 'v1.ActivityCategoryUnlinked',
		schema: Schema.Struct({
			id: Schema.String,
			deletedAt: Schema.Date
		})
	})
};

// Events for time session operations
const timeSessionEvents = {
	timeSessionStarted: Events.synced({
		name: 'v1.TimeSessionStarted',
		schema: Schema.Struct({
			id: Schema.String,
			activityId: Schema.String,
			userId: Schema.String,
			startedAt: Schema.Date
		})
	}),
	timeSessionStopped: Events.synced({
		name: 'v1.TimeSessionStopped',
		schema: Schema.Struct({
			id: Schema.String,
			stoppedAt: Schema.Date,
			duration: Schema.Number
		})
	}),
	timeSessionUpdated: Events.synced({
		name: 'v1.TimeSessionUpdated',
		schema: Schema.Struct({
			id: Schema.String,
			startedAt: Schema.optional(Schema.Date),
			stoppedAt: Schema.optional(Schema.Date),
			duration: Schema.optional(Schema.Number),
			notes: Schema.optional(Schema.NullOr(Schema.String))
		})
	}),
	timeSessionDeleted: Events.synced({
		name: 'v1.TimeSessionDeleted',
		schema: Schema.Struct({
			id: Schema.String,
			deletedAt: Schema.Date
		})
	}),
	// For creating sessions manually (e.g., from daily view)
	timeSessionCreated: Events.synced({
		name: 'v1.TimeSessionCreated',
		schema: Schema.Struct({
			id: Schema.String,
			activityId: Schema.String,
			userId: Schema.String,
			startedAt: Schema.Date,
			stoppedAt: Schema.Date,
			duration: Schema.Number,
			notes: Schema.NullOr(Schema.String)
		})
	})
};

// Combine all events
export const events = {
	...categoryEvents,
	...activityEvents,
	...activityCategoryEvents,
	...timeSessionEvents,
	uiStateSet: tables.uiState.set
};

// Materializers map events to state changes
const materializers = State.SQLite.materializers(events, {
	// Category materializers
	'v1.CategoryCreated': ({ id, name, color, icon, userId }) =>
		tables.categories.insert({ id, name, color, icon, userId }),
	'v1.CategoryUpdated': ({ id, ...updates }) => tables.categories.update(updates).where({ id }),
	'v1.CategoryDeleted': ({ id, deletedAt }) => tables.categories.update({ deletedAt }).where({ id }),

	// Activity materializers
	'v1.ActivityCreated': ({ id, name, icon, dailyGoal, weeklyGoal, monthlyGoal, userId }) =>
		tables.activities.insert({ id, name, icon, dailyGoal, weeklyGoal, monthlyGoal, userId }),
	'v1.ActivityUpdated': ({ id, ...updates }) => tables.activities.update(updates).where({ id }),
	'v1.ActivityArchived': ({ id }) => tables.activities.update({ archived: true }).where({ id }),
	'v1.ActivityUnarchived': ({ id }) => tables.activities.update({ archived: false }).where({ id }),
	'v1.ActivityDeleted': ({ id, deletedAt }) => tables.activities.update({ deletedAt }).where({ id }),

	// Activity-Category link materializers
	'v1.ActivityCategoryLinked': ({ id, activityId, categoryId }) =>
		tables.activityCategories.insert({ id, activityId, categoryId }),
	'v1.ActivityCategoryUnlinked': ({ id, deletedAt }) =>
		tables.activityCategories.update({ deletedAt }).where({ id }),

	// Time session materializers
	'v1.TimeSessionStarted': ({ id, activityId, userId, startedAt }) =>
		tables.timeSessions.insert({ id, activityId, userId, startedAt, isActive: true }),
	'v1.TimeSessionStopped': ({ id, stoppedAt, duration }) =>
		tables.timeSessions.update({ stoppedAt, duration, isActive: false }).where({ id }),
	'v1.TimeSessionUpdated': ({ id, ...updates }) => tables.timeSessions.update(updates).where({ id }),
	'v1.TimeSessionDeleted': ({ id, deletedAt }) =>
		tables.timeSessions.update({ deletedAt }).where({ id }),
	'v1.TimeSessionCreated': ({ id, activityId, userId, startedAt, stoppedAt, duration, notes }) =>
		tables.timeSessions.insert({
			id,
			activityId,
			userId,
			startedAt,
			stoppedAt,
			duration,
			isActive: false,
			notes
		})
});

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
