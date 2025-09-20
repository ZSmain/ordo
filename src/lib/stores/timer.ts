import { writable } from 'svelte/store';

// Timer state interface
export interface TimerState {
	isActive: boolean;
	categoryName: string;
	activityName: string;
	activityId: number | null;
	sessionId: number | null;
	startTime: number | null; // timestamp when timer started
}

// Database session interface for type safety
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

// Default timer state
const defaultTimerState: TimerState = {
	isActive: false,
	categoryName: '',
	activityName: '',
	activityId: null,
	sessionId: null,
	startTime: null
};

// Create a simple store without localStorage complexity
function createTimerStore() {
	const { subscribe, set } = writable<TimerState>(defaultTimerState);

	return {
		subscribe,
		set,
		startTimer: (
			categoryName: string,
			activityName: string,
			activityId: number,
			sessionId: number
		) => {
			const newState: TimerState = {
				isActive: true,
				categoryName,
				activityName,
				activityId,
				sessionId,
				startTime: Date.now()
			};
			set(newState);
		},
		stopTimer: () => {
			set(defaultTimerState);
		},
		reset: () => {
			set(defaultTimerState);
		}
	};
}

export const timerStore = createTimerStore();

// Helper function to calculate current elapsed time from database start time
export function calculateElapsedTime(state: TimerState): number {
	if (!state.isActive || !state.startTime) {
		return 0;
	}

	const now = Date.now();
	const sessionElapsed = Math.floor((now - state.startTime) / 1000);
	return sessionElapsed;
}

// Helper function to restore timer state from database session
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
