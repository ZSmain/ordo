import { activityCategory, category, type SelectCategory } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export type ActivityCategoryDetails = Pick<SelectCategory, 'id' | 'name' | 'color' | 'icon'>;

export type ActivityWithCategories<TActivity extends { id: number }> = TActivity & {
	categories: ActivityCategoryDetails[];
};

export type CategoryWithActivities<TActivity extends { categories: ActivityCategoryDetails[] }> =
	SelectCategory & {
		activities: TActivity[];
	};

export const UNCATEGORIZED_ACTIVITY_CATEGORY: ActivityCategoryDetails = {
	id: 0,
	name: 'Uncategorized',
	color: '#gray',
	icon: '📂'
};

export async function getCategoriesForActivityIds(
	db: App.Locals['db'],
	activityIds: number[]
): Promise<Map<number, ActivityCategoryDetails[]>> {
	if (activityIds.length === 0) {
		return new Map();
	}

	const rows = await db
		.select({
			activityId: activityCategory.activityId,
			categoryId: category.id,
			categoryName: category.name,
			categoryColor: category.color,
			categoryIcon: category.icon
		})
		.from(activityCategory)
		.innerJoin(category, eq(activityCategory.categoryId, category.id))
		.where(inArray(activityCategory.activityId, activityIds))
		.all();

	const categoriesByActivityId = new Map<number, ActivityCategoryDetails[]>();

	for (const row of rows) {
		const categories = categoriesByActivityId.get(row.activityId) ?? [];

		if (!categories.some((item) => item.id === row.categoryId)) {
			categories.push({
				id: row.categoryId,
				name: row.categoryName,
				color: row.categoryColor,
				icon: row.categoryIcon
			});
		}

		categoriesByActivityId.set(row.activityId, categories);
	}

	return categoriesByActivityId;
}

export async function getCategoriesForActivityId(
	db: App.Locals['db'],
	activityId: number
): Promise<ActivityCategoryDetails[]> {
	return (await getCategoriesForActivityIds(db, [activityId])).get(activityId) ?? [];
}

export function hydrateActivitiesWithCategories<TActivity extends { id: number }>(
	activities: TActivity[],
	categoriesByActivityId: Map<number, ActivityCategoryDetails[]>
): Array<ActivityWithCategories<TActivity>> {
	return activities.map((item) => ({
		...item,
		categories: categoriesByActivityId.get(item.id) ?? []
	}));
}

export function groupActivitiesByCategory<
	TActivity extends { categories: ActivityCategoryDetails[] }
>(categories: SelectCategory[], activities: TActivity[]): Array<CategoryWithActivities<TActivity>> {
	return categories.map((item) => ({
		...item,
		activities: activities.filter((activity) =>
			activity.categories.some((activityCategory) => activityCategory.id === item.id)
		)
	}));
}

export function getRepresentativeCategory(
	categories: ActivityCategoryDetails[],
	fallback: ActivityCategoryDetails = UNCATEGORIZED_ACTIVITY_CATEGORY
): ActivityCategoryDetails {
	return categories[0] ?? fallback;
}
