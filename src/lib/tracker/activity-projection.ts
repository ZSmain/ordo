import type { SelectionState } from '$lib/stores/selection';

export interface TrackerActivity {
	id: number;
	name: string;
	icon: string;
	dailyGoal: number | null;
	weeklyGoal: number | null;
	monthlyGoal: number | null;
	favorite: boolean;
	archived: boolean;
	categories?: TrackerActivityCategory[];
	[key: string]: unknown;
}

export interface TrackerActivityCategory {
	id: number;
	name: string;
	color: string;
	icon: string;
	[key: string]: unknown;
}

export interface TrackerCategory<TActivity extends TrackerActivity = TrackerActivity> {
	id: number;
	name: string;
	color: string;
	activities: TActivity[];
	[key: string]: unknown;
}

export interface TrackerActivityRow<TActivity extends TrackerActivity = TrackerActivity> {
	activity: TActivity;
	categoryColor: string;
	categoryName: string;
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
	category: Pick<TrackerCategory<TActivity>, 'color' | 'name'>
): TrackerActivityRow<TActivity> {
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

	if (selection.filterMode === 'AND' && selectedCategories.length > 1) {
		let intersection = selectedCategories[0].activities;

		for (let index = 1; index < selectedCategories.length; index += 1) {
			const activityIds = new Set(
				selectedCategories[index].activities.map((activity) => activity.id)
			);
			intersection = intersection.filter((activity) => activityIds.has(activity.id));
		}

		return intersection.map((activity) => toTrackerActivityRow(activity, selectedCategories[0]));
	}

	const activities = new Map<number, TrackerActivityRow<TActivity>>();

	for (const category of selectedCategories) {
		for (const activity of category.activities) {
			if (!activities.has(activity.id)) {
				activities.set(activity.id, toTrackerActivityRow(activity, category));
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

			favorites.set(activity.id, toTrackerActivityRow(activity, category));
		}
	}

	return Array.from(favorites.values()).sort((left, right) =>
		left.activity.name.localeCompare(right.activity.name)
	);
}
