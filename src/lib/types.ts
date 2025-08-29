import type { InferSelectModel } from 'drizzle-orm';
import type { activity, category } from './server/db/schema';

export type Category = InferSelectModel<typeof category>;
export type Activity = InferSelectModel<typeof activity>;

// Category with activities type (for when categories are fetched with their related activities)
export type CategoryWithActivities = Category & {
	activities: Activity[];
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

