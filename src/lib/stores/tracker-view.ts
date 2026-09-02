import { PersistedState } from 'runed';

export type TrackerTab = 'activities' | 'favorites' | 'archived';

const defaultTrackerTab: TrackerTab = 'activities';

export const trackerTabPersistedState = new PersistedState<TrackerTab>(
	'ordo-tracker-tab',
	defaultTrackerTab,
	{
		storage: 'local',
		syncTabs: true
	}
);
