import { getActiveSession, startTimerSession, stopTimerSession } from '$lib/api/data.remote';
import { restoreTimerFromDatabase, timerStore, type TimerState } from './timer';
import { toast } from 'svelte-sonner';

type TrackerSessionInput = {
	userId: string;
	activityId: number;
	activityName: string;
	categoryName: string;
};

type RedirectLike = {
	status: number;
	location: string;
};

let latestOperationId = 0;
let mutationChain: Promise<unknown> = Promise.resolve();

function isRedirect(error: unknown): error is RedirectLike {
	return !!error && typeof error === 'object' && 'status' in error && 'location' in error;
}

function nextOperationId() {
	latestOperationId += 1;
	return latestOperationId;
}

function isCurrentOperation(operationId: number) {
	return latestOperationId === operationId;
}

function snapshotTimerState(): TimerState {
	return { ...timerStore.current };
}

function queueMutation<T>(task: () => Promise<T>): Promise<T> {
	const result = mutationChain.catch(() => undefined).then(task);
	mutationChain = result.catch(() => undefined);
	return result;
}

function createOptimisticActiveSession({
	userId,
	activityId,
	activityName,
	categoryName
}: TrackerSessionInput) {
	const now = new Date();

	return {
		session: {
			id: -1,
			activityId,
			userId,
			startedAt: now,
			stoppedAt: null,
			duration: null,
			notes: null,
			isActive: true,
			createdAt: now,
			updatedAt: now
		},
		activity: {
			id: activityId,
			name: activityName,
			icon: '⏱️',
			userId
		},
		category: {
			name: categoryName
		}
	};
}

function isSameTimerState(nextState: TimerState) {
	return (
		timerStore.current.isActive === nextState.isActive &&
		timerStore.current.sessionId === nextState.sessionId &&
		timerStore.current.activityId === nextState.activityId
	);
}

async function resolveSessionIdForStop(previousState: TimerState) {
	if (previousState.sessionId && previousState.sessionId > 0) {
		return previousState.sessionId;
	}

	if (!previousState.activityId) {
		return null;
	}

	const activeSession = await getActiveSession();

	if (!activeSession || activeSession.activity.id !== previousState.activityId) {
		return null;
	}

	return activeSession.session.id;
}

async function reconcile() {
	await mutationChain.catch(() => undefined);

	try {
		const activeSession = await getActiveSession();

		if (activeSession) {
			const nextState = restoreTimerFromDatabase(activeSession);

			if (!isSameTimerState(nextState)) {
				timerStore.set(nextState);
			}

			return;
		}

		if (timerStore.current.isActive) {
			timerStore.stopTimer();
		}
	} catch (error) {
		console.error('Failed to sync timer:', error);
	}
}

async function start(input: TrackerSessionInput) {
	const operationId = nextOperationId();
	const previousState = snapshotTimerState();

	timerStore.startTimer(input.categoryName, input.activityName, input.activityId, -1);

	return queueMutation(async () => {
		try {
			const session = await startTimerSession({ activityId: input.activityId }).updates(
				getActiveSession().withOverride(() => createOptimisticActiveSession(input))
			);

			if (isCurrentOperation(operationId)) {
				timerStore.updateSessionId(session.id);
			}
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			console.error('Failed to start timer session:', error);

			if (isCurrentOperation(operationId)) {
				timerStore.set(previousState);
				toast.error('Failed to start timer. Please check your connection and try again.');
			}
		}
	});
}

async function stop() {
	const operationId = nextOperationId();
	const previousState = snapshotTimerState();

	timerStore.stopTimer();

	if (!previousState.isActive) {
		return;
	}

	return queueMutation(async () => {
		const sessionId = await resolveSessionIdForStop(previousState);

		if (!sessionId || sessionId <= 0) {
			return;
		}

		try {
			await stopTimerSession({ sessionId }).updates(getActiveSession().withOverride(() => null));
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			console.error('Failed to stop timer session:', error);

			if (isCurrentOperation(operationId)) {
				timerStore.set(previousState);
				toast.error('Failed to stop timer. Please try again.');
			}
		}
	});
}

async function toggle(input: TrackerSessionInput) {
	if (timerStore.current.isActive && timerStore.current.activityId === input.activityId) {
		return stop();
	}

	return start(input);
}

export const trackerSessionController = {
	reconcile,
	start,
	stop,
	toggle
};
