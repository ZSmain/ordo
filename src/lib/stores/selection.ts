import { browser } from '$app/environment';
import { PersistedState } from 'runed';

// Selection state interface
export interface SelectionState {
	selectedCategoryIds: string[];
	filterMode: 'AND' | 'OR';
}

// Default selection state
const defaultSelectionState: SelectionState = {
	selectedCategoryIds: [],
	filterMode: 'OR'
};

const selectionStorageKey = 'ordo-selection-state';

function normalizeSelectionState(parsed: unknown): SelectionState | null {
	if (!parsed || typeof parsed !== 'object') {
		return null;
	}

	if ('selectedCategoryId' in parsed) {
		const selectedCategoryId = parsed.selectedCategoryId;

		return {
			selectedCategoryIds:
				typeof selectedCategoryId === 'string' && selectedCategoryId ? [selectedCategoryId] : [],
			filterMode: 'OR'
		};
	}

	const { selectedCategoryIds, filterMode } = parsed as Partial<SelectionState>;

	return {
		selectedCategoryIds: Array.isArray(selectedCategoryIds)
			? selectedCategoryIds.filter((id): id is string => typeof id === 'string')
			: [],
		filterMode: filterMode === 'AND' ? 'AND' : 'OR'
	};
}

if (browser) {
	const stored = localStorage.getItem(selectionStorageKey);

	if (stored) {
		try {
			const normalized = normalizeSelectionState(JSON.parse(stored));

			if (normalized) {
				localStorage.setItem(selectionStorageKey, JSON.stringify(normalized));
			} else {
				localStorage.removeItem(selectionStorageKey);
			}
		} catch (error) {
			console.error('Failed to parse selection state', error);
			localStorage.removeItem(selectionStorageKey);
		}
	}
}

export const selectionPersistedState = new PersistedState(
	selectionStorageKey,
	defaultSelectionState,
	{
		storage: 'local',
		syncTabs: true
	}
);

function createSelectionStore() {
	return {
		get current() {
			return selectionPersistedState.current;
		},

		set: (value: SelectionState) => {
			selectionPersistedState.current = value;
		},

		toggleCategory: (categoryId: string) => {
			const ids = selectionPersistedState.current.selectedCategoryIds;
			const index = ids.indexOf(categoryId);

			selectionPersistedState.current = {
				...selectionPersistedState.current,
				selectedCategoryIds:
					index >= 0 ? [...ids.slice(0, index), ...ids.slice(index + 1)] : [...ids, categoryId]
			};
		},

		setFilterMode: (mode: 'AND' | 'OR') => {
			selectionPersistedState.current = {
				...selectionPersistedState.current,
				filterMode: mode
			};
		},

		reset: () => {
			selectionPersistedState.current = defaultSelectionState;
		}
	};
}

export const selectionStore = createSelectionStore();
