import type { SelectionState } from '$lib/stores/selection';
import type { SelectActivity, SelectCategory } from '$lib/server/db/schema';

export type TrackerActivityCategory = Pick<SelectCategory, 'id' | 'name' | 'color' | 'icon'>;

export type TrackerActivity = Pick<
	SelectActivity,
	'id' | 'name' | 'icon' | 'dailyGoal' | 'weeklyGoal' | 'monthlyGoal' | 'favorite' | 'archived'
> & {
	categories: TrackerActivityCategory[];
};

export type TrackerCategory<TActivity extends TrackerActivity = TrackerActivity> = Pick<
	SelectCategory,
	'id' | 'name' | 'color'
> & {
	activities: TActivity[];
};

export interface TrackerActivityRow<TActivity extends TrackerActivity = TrackerActivity> {
	activity: TActivity;
	categoryColor: string;
	categoryName: string;
}

const UNCATEGORIZED_TRACKER_CATEGORY: TrackerActivityCategory = {
	id: 0,
	name: 'Uncategorized',
	color: '#6B7280',
	icon: '📂'
};

function getRepresentativeActivityCategory(
	activity: TrackerActivity,
	selectedCategoryIds?: ReadonlySet<number>
): TrackerActivityCategory {
	const matchingCategories = selectedCategoryIds
		? activity.categories.filter((category) => selectedCategoryIds.has(category.id))
		: activity.categories;

	const candidateCategories =
		matchingCategories.length > 0 ? matchingCategories : activity.categories;

	if (candidateCategories.length === 0) {
		return UNCATEGORIZED_TRACKER_CATEGORY;
	}

	return [...candidateCategories].sort((left, right) => {
		const nameComparison = left.name.localeCompare(right.name);

		if (nameComparison !== 0) {
			return nameComparison;
		}

		return left.id - right.id;
	})[0];
}

function toSelectedCategories<TCategory extends TrackerCategory>(
	categories: TCategory[],
	selectedCategoryIds: string[]
): TCategory[] {
	return selectedCategoryIds
		.map((categoryId) => categories.find((item) => item.id === Number(categoryId)))
		.filter((item): item is TCategory => Boolean(item));
}

function toTrackerActivityRow<TActivity extends TrackerActivity>(
	activity: TActivity,
	selectedCategoryIds?: ReadonlySet<number>
): TrackerActivityRow<TActivity> {
	const category = getRepresentativeActivityCategory(activity, selectedCategoryIds);

	return {
		activity,
		categoryColor: category.color,
		categoryName: category.name
	};
}

export function projectSelectedActivities<
	TActivity extends TrackerActivity,
	TCategory extends TrackerCategory<TActivity>
>(
	categories: TCategory[] | null | undefined,
	selection: SelectionState
): TrackerActivityRow<TActivity>[] {
	if (!categories || selection.selectedCategoryIds.length === 0) {
		return [];
	}

	const selectedCategories = toSelectedCategories(categories, selection.selectedCategoryIds);

	if (selectedCategories.length === 0) {
		return [];
	}

	const selectedCategoryIdSet = new Set(selectedCategories.map((category) => category.id));

	if (selection.filterMode === 'AND' && selectedCategories.length > 1) {
		let intersection = selectedCategories[0].activities;

		for (let index = 1; index < selectedCategories.length; index += 1) {
			const activityIds = new Set(
				selectedCategories[index].activities.map((activity) => activity.id)
			);
			intersection = intersection.filter((activity) => activityIds.has(activity.id));
		}

		return intersection.map((activity) => toTrackerActivityRow(activity, selectedCategoryIdSet));
	}

	const activities = new Map<number, TrackerActivityRow<TActivity>>();

	for (const category of selectedCategories) {
		for (const activity of category.activities) {
			if (!activities.has(activity.id)) {
				activities.set(activity.id, toTrackerActivityRow(activity, selectedCategoryIdSet));
			}
		}
	}

	return Array.from(activities.values());
}

export function projectFavoriteActivities<
	TActivity extends TrackerActivity,
	TCategory extends TrackerCategory<TActivity>
>(categories: TCategory[] | null | undefined): TrackerActivityRow<TActivity>[] {
	if (!categories) {
		return [];
	}

	const favorites = new Map<number, TrackerActivityRow<TActivity>>();

	for (const category of categories) {
		for (const activity of category.activities) {
			if (activity.archived || !activity.favorite || favorites.has(activity.id)) {
				continue;
			}

			favorites.set(activity.id, toTrackerActivityRow(activity));
		}
	}

	return Array.from(favorites.values()).sort((left, right) =>
		left.activity.name.localeCompare(right.activity.name)
	);
}
