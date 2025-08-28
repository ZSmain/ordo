import { query } from '$app/server';
import { db } from '$lib/server/db';
import { category, activity } from '$lib/server/db/schema';

// Return all categories with their activities
export const getCategoriesWithActivities = query(async () => {
    // Get all categories and activities
    const categories = await db.select().from(category).all();
    const activities = await db.select().from(activity).all();
    
    // Group activities by category
    const categoriesWithActivities = categories.map(cat => {
        const categoryActivities = activities.filter(act => act.categoryId === cat.id);
        return {
            ...cat,
            activities: categoryActivities
        };
    });
    
    return categoriesWithActivities;
});
