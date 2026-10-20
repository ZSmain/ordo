import type { GoalValues } from '#lib/goals/index.js';

/** Serializable DTOs for the remote-function boundary. Never import server/db/schema here. */

export type CategoryDto = {
	id: number;
	name: string;
	color: string;
	icon: string;
};

export type ActivityGoalState = {
	/** Goals in effect today, or null when none are set. */
	current: GoalValues | null;
	/** Scheduled change taking effect tomorrow, or null when none is scheduled. */
	pending: GoalValues | null;
	/** Date key the pending change takes effect on, or null when none is scheduled. */
	effectiveDate: string | null;
};

export type ActivityDto = {
	id: number;
	name: string;
	icon: string;
	favorite: boolean;
	archived: boolean;
	goals: ActivityGoalState;
	categories: CategoryDto[];
};

export type CategoryWithActivitiesDto = CategoryDto & {
	activities: ActivityDto[];
};

export type ActiveSessionDto = {
	session: {
		id: number;
		activityId: number;
		startedAt: Date;
		isActive: boolean;
	};
	activity: {
		id: number;
		name: string;
		icon: string;
	};
	category: {
		name: string;
	};
};

export type StartedSessionDto = {
	id: number;
	activityId: number;
	startedAt: Date;
	isActive: boolean;
};

export type StoppedSessionDto = {
	id: number;
	activityId: number;
	startedAt: Date;
	stoppedAt: Date | null;
	duration: number | null;
	isActive: boolean;
};

export type ManualSessionDto = {
	id: number;
	activityId: number;
	startedAt: Date;
	stoppedAt: Date | null;
	duration: number | null;
	notes: string | null;
};

export type DailyActivityDto = {
	id: number;
	name: string;
	icon: string;
	categories: CategoryDto[];
};

export type DailySessionDto = {
	id: number;
	startedAt: Date;
	stoppedAt: Date | null;
	duration: number | null;
	notes: string | null;
	activity: {
		id: number;
		name: string;
		icon: string;
	};
	categories: CategoryDto[];
};
