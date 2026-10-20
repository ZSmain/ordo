import type {
	ActiveSessionDto,
	ActivityDto,
	ActivityGoalState,
	CategoryDto,
	ManualSessionDto,
	StartedSessionDto,
	StoppedSessionDto
} from '#lib/tracker/dtos.js';
import type { SelectActivity, SelectCategory, SelectTimeSession } from './db/schema.js';

export function toCategoryDto(
	row: Pick<SelectCategory, 'id' | 'name' | 'color' | 'icon'>
): CategoryDto {
	return {
		id: row.id,
		name: row.name,
		color: row.color,
		icon: row.icon
	};
}

type ActivityRow = Pick<SelectActivity, 'id' | 'name' | 'icon' | 'favorite' | 'archived'>;

export function toActivityDto(
	row: ActivityRow,
	goals: ActivityGoalState,
	categories: CategoryDto[]
): ActivityDto {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		favorite: row.favorite,
		archived: row.archived,
		goals,
		categories
	};
}

type ActiveSessionRow = Pick<SelectTimeSession, 'id' | 'activityId' | 'startedAt' | 'isActive'>;
type ActiveActivityRow = Pick<SelectActivity, 'id' | 'name' | 'icon'>;

export function toActiveSessionDto(
	session: ActiveSessionRow,
	activity: ActiveActivityRow,
	categoryName: string
): ActiveSessionDto {
	return {
		session: {
			id: session.id,
			activityId: session.activityId,
			startedAt: session.startedAt,
			isActive: session.isActive
		},
		activity: {
			id: activity.id,
			name: activity.name,
			icon: activity.icon
		},
		category: {
			name: categoryName
		}
	};
}

export function toStartedSessionDto(
	row: Pick<SelectTimeSession, 'id' | 'activityId' | 'startedAt' | 'isActive'>
): StartedSessionDto {
	return {
		id: row.id,
		activityId: row.activityId,
		startedAt: row.startedAt,
		isActive: row.isActive
	};
}

export function toStoppedSessionDto(
	row: Pick<
		SelectTimeSession,
		'id' | 'activityId' | 'startedAt' | 'stoppedAt' | 'duration' | 'isActive'
	>
): StoppedSessionDto {
	return {
		id: row.id,
		activityId: row.activityId,
		startedAt: row.startedAt,
		stoppedAt: row.stoppedAt,
		duration: row.duration,
		isActive: row.isActive
	};
}

export function toManualSessionDto(
	row: Pick<
		SelectTimeSession,
		'id' | 'activityId' | 'startedAt' | 'stoppedAt' | 'duration' | 'notes'
	>
): ManualSessionDto {
	return {
		id: row.id,
		activityId: row.activityId,
		startedAt: row.startedAt,
		stoppedAt: row.stoppedAt,
		duration: row.duration,
		notes: row.notes
	};
}
