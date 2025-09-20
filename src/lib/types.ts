import type { InferSelectModel } from 'drizzle-orm';
import type { activity, category } from './server/db/schema';

export type Category = InferSelectModel<typeof category>;
export type Activity = InferSelectModel<typeof activity>;

// Activity with categories type (for when activities are fetched with their related categories)
export type ActivityWithCategories = Activity & {
	categories: Category[];
};

// Activity with optional categories (for backward compatibility)
export type ActivityWithOptionalCategories = Activity & {
	categories?: Category[];
};

// Category with activities type (for when categories are fetched with their related activities)
export type CategoryWithActivities = Category & {
	activities: ActivityWithOptionalCategories[];
};

// Re-export validation schemas and types for easier importing
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
