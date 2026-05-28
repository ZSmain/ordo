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

		setSelectedCategories: (selectedCategoryIds: string[]) => {
			const current = selectionPersistedState.current;
			const normalizedSelectedCategoryIds = [...new Set(selectedCategoryIds)];

			selectionPersistedState.current = {
				...current,
				selectedCategoryIds: normalizedSelectedCategoryIds,
				filterMode:
					normalizedSelectedCategoryIds.length > current.selectedCategoryIds.length &&
					normalizedSelectedCategoryIds.length > 1 &&
					current.filterMode === 'OR'
						? 'AND'
						: current.filterMode
			};
		},

		toggleCategory: (categoryId: string) => {
			const current = selectionPersistedState.current;
			const isSelected = current.selectedCategoryIds.includes(categoryId);
			const selectedCategoryIds = isSelected
				? current.selectedCategoryIds.filter((id) => id !== categoryId)
				: [...current.selectedCategoryIds, categoryId];

			selectionPersistedState.current = {
				...current,
				selectedCategoryIds,
				filterMode:
					!isSelected && selectedCategoryIds.length > 1 && current.filterMode === 'OR'
						? 'AND'
						: current.filterMode
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
