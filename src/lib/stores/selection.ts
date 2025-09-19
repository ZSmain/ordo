import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Selection state interface
export interface SelectionState {
    selectedCategoryId: string;
}

// Default selection state
const defaultSelectionState: SelectionState = {
    selectedCategoryId: ''
};

// Create the store with localStorage persistence
function createSelectionStore() {
    // Initialize from localStorage if available
    const stored = browser ? localStorage.getItem('ordo-selection-state') : null;
    const initial = stored ? JSON.parse(stored) : defaultSelectionState;

    const { subscribe, set } = writable<SelectionState>(initial);

    return {
        subscribe,
        setSelectedCategory: (categoryId: string) => {
            const newState: SelectionState = {
                selectedCategoryId: categoryId
            };
            set(newState);
            if (browser) {
                localStorage.setItem('ordo-selection-state', JSON.stringify(newState));
            }
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