import { PersistedState } from 'runed';

export interface TimerState {
	isActive: boolean;
	categoryName: string;
	activityName: string;
	activityId: number | null;
	sessionId: number | null;
	startTime: number | null;
}

export interface DatabaseSession {
	session: {
		id: number;
		startedAt: Date;
		isActive: boolean;
	};
	activity: {
		id: number;
		name: string;
	};
	category: {
		name: string;
	};
}

const defaultTimerState: TimerState = {
	isActive: false,
	categoryName: '',
	activityName: '',
	activityId: null,
	sessionId: null,
	startTime: null
};

export const timerPersistedState = new PersistedState('ordo-timer-state', defaultTimerState, {
	storage: 'local',
	syncTabs: true
});

function createTimerStore() {
	return {
		get current() {
			return timerPersistedState.current;
		},

		set: (value: TimerState) => {
			timerPersistedState.current = value;
		},

		startTimer: (
			categoryName: string,
			activityName: string,
			activityId: number,
			sessionId: number
		) => {
			timerPersistedState.current = {
				isActive: true,
				categoryName,
				activityName,
				activityId,
				sessionId,
				startTime: Date.now()
			};
		},

		updateSessionId: (sessionId: number) => {
			if (timerPersistedState.current.isActive) {
				timerPersistedState.current = {
					...timerPersistedState.current,
					sessionId
				};
			}
		},

		stopTimer: () => {
			timerPersistedState.current = defaultTimerState;
		},

		reset: () => {
			timerPersistedState.current = defaultTimerState;
		}
	};
}

export const timerStore = createTimerStore();

export function calculateElapsedTime(state: TimerState): number {
	if (!state.isActive || !state.startTime) {
		return 0;
	}

	const now = Date.now();
	const sessionElapsed = Math.floor((now - state.startTime) / 1000);
	return sessionElapsed;
}

export function restoreTimerFromDatabase(sessionData: DatabaseSession | null): TimerState {
	if (!sessionData || !sessionData.session || !sessionData.session.isActive) {
		return defaultTimerState;
	}

	const session = sessionData.session;
	const activity = sessionData.activity;
	const category = sessionData.category;

	return {
		isActive: true,
		categoryName: category.name,
		activityName: activity.name,
		activityId: activity.id,
		sessionId: session.id,
		startTime: session.startedAt.getTime()
	};
}
