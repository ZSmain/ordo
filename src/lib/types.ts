import type { InferSelectModel } from 'drizzle-orm';
import type { activity, category } from './server/db/schema';

export type Category = InferSelectModel<typeof category>;
export type Activity = InferSelectModel<typeof activity>;

export type ActivityWithCategories = Activity & {
	categories: Category[];
};

export type ActivityWithOptionalCategories = Activity & {
	categories?: Category[];
};

export type CategoryWithActivities = Category & {
	activities: ActivityWithOptionalCategories[];
};

export {
	insertActivitySchema,
	insertCategorySchema,
	selectActivitySchema,
	selectCategorySchema,
	type InsertActivity,
	type InsertCategory,
	type SelectActivity,
	type SelectCategory
} from './server/db/schema';
