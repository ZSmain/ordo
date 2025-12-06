import { browser } from '$app/environment';
import { writable } from 'svelte/store';

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

// Create the store with localStorage persistence
function createSelectionStore() {
    // Initialize from localStorage if available
    const stored = browser ? localStorage.getItem('ordo-selection-state') : null;
    let initial = defaultSelectionState;
    
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Migrate old state if needed
            if ('selectedCategoryId' in parsed) {
                initial = {
                    selectedCategoryIds: parsed.selectedCategoryId ? [parsed.selectedCategoryId] : [],
                    filterMode: 'OR'
                };
            } else {
                // Ensure filterMode exists for existing states
                initial = {
                    ...defaultSelectionState,
                    ...parsed
                };
            }
        } catch (e) {
            console.error('Failed to parse selection state', e);
        }
    }

    const { subscribe, update, set } = writable<SelectionState>(initial);

    return {
        subscribe,
        toggleCategory: (categoryId: string) => {
            update(state => {
                const ids = state.selectedCategoryIds || [];
                const index = ids.indexOf(categoryId);
                
                let newIds;
                if (index >= 0) {
                    // Remove if already selected
                    newIds = [...ids.slice(0, index), ...ids.slice(index + 1)];
                } else {
                    // Add if not selected
                    newIds = [...ids, categoryId];
                }
                
                const newState = { ...state, selectedCategoryIds: newIds };
                if (browser) {
                    localStorage.setItem('ordo-selection-state', JSON.stringify(newState));
                }
                return newState;
            });
        },
        setFilterMode: (mode: 'AND' | 'OR') => {
            update(state => {
                const newState = { ...state, filterMode: mode };
                if (browser) {
                    localStorage.setItem('ordo-selection-state', JSON.stringify(newState));
                }
                return newState;
            });
        },
        reset: () => {
            set(defaultSelectionState);
            if (browser) {
                localStorage.removeItem('ordo-selection-state');
            }
        }
    };
}

export const selectionStore = createSelectionStore();