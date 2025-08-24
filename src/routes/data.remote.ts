import { query } from '$app/server';
import { db } from '$lib/server/db';
import { category, selectCategorySchema } from '$lib/server/db/schema';
import * as v from 'valibot';

// Return all categories (id, name, color, icon)
export const getCategories = query(async () => {
    // TODO: Scope this by user; for now return all
    const categories = await db.select().from(category).all();

    // Validate the output using the schema
    return categories.map(cat => v.parse(selectCategorySchema, cat));
});
