import type { InferSelectModel } from 'drizzle-orm';
import type { category } from './server/db/schema';

export type Category = InferSelectModel<typeof category>;

// Re-export validation schemas and types for easier importing
export { 
	insertCategorySchema, 
	selectCategorySchema,
	type InsertCategory,
	type SelectCategory 
} from './server/db/schema';
