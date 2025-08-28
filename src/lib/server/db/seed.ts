import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import * as schema from './schema';
import { category, activity } from './schema';

// Load .env file
config();

async function seed() {
	console.log('🌱 Seeding database...');

	// Create database connection - SvelteKit automatically loads .env files
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const client = createClient({ url: databaseUrl });
	const db = drizzle(client, { schema });

	// Create example categories
	const categories = [
		{
			name: 'Work',
			color: '#3B82F6', // Blue
			icon: '💼'
		},
		{
			name: 'Health & Fitness',
			color: '#10B981', // Green
			icon: '💪'
		},
		{
			name: 'Learning',
			color: '#8B5CF6', // Purple
			icon: '📚'
		},
		{
			name: 'Personal',
			color: '#F59E0B', // Amber
			icon: '🏠'
		},
		{
			name: 'Creative',
			color: '#EF4444', // Red
			icon: '🎨'
		},
		{
			name: 'Social',
			color: '#EC4899', // Pink
			icon: '👥'
		}
	];

	console.log('Creating categories...');
	const insertedCategories = await db.insert(category).values(categories).returning();

	// Create example activities for each category
	const activities = [
		// Work activities
		{
			name: 'Deep Work Session',
			dailyGoal: 240, // 4 hours
			weeklyGoal: 1200, // 20 hours
			monthlyGoal: 4800, // 80 hours
			categoryId: insertedCategories[0].id
		},
		{
			name: 'Email & Communication',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[0].id
		},
		{
			name: 'Meetings',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			categoryId: insertedCategories[0].id
		},

		// Health & Fitness activities
		{
			name: 'Morning Exercise',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[1].id
		},
		{
			name: 'Meditation',
			dailyGoal: 20, // 20 minutes
			weeklyGoal: 140, // 2 hours 20 minutes
			monthlyGoal: 600, // 10 hours
			categoryId: insertedCategories[1].id
		},
		{
			name: 'Healthy Meal Prep',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[1].id
		},

		// Learning activities
		{
			name: 'Reading Technical Books',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[2].id
		},
		{
			name: 'Online Courses',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[2].id
		},
		{
			name: 'Practice Coding',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 450, // 7.5 hours
			monthlyGoal: 1800, // 30 hours
			categoryId: insertedCategories[2].id
		},

		// Personal activities
		{
			name: 'Household Chores',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[3].id
		},
		{
			name: 'Personal Finance',
			dailyGoal: 15, // 15 minutes
			weeklyGoal: 60, // 1 hour
			monthlyGoal: 240, // 4 hours
			categoryId: insertedCategories[3].id
		},
		{
			name: 'Journaling',
			dailyGoal: 10, // 10 minutes
			weeklyGoal: 70, // ~1 hour 10 minutes
			monthlyGoal: 300, // 5 hours
			categoryId: insertedCategories[3].id
		},

		// Creative activities
		{
			name: 'Writing',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[4].id
		},
		{
			name: 'Digital Art',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 360, // 6 hours
			monthlyGoal: 1440, // 24 hours
			categoryId: insertedCategories[4].id
		},
		{
			name: 'Music Practice',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 225, // 3.75 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[4].id
		},

		// Social activities
		{
			name: 'Family Time',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			categoryId: insertedCategories[5].id
		},
		{
			name: 'Friend Calls',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 150, // 2.5 hours
			monthlyGoal: 600, // 10 hours
			categoryId: insertedCategories[5].id
		},
		{
			name: 'Networking',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 180, // 3 hours
			monthlyGoal: 720, // 12 hours
			categoryId: insertedCategories[5].id
		}
	];

	console.log('Creating activities...');
	await db.insert(activity).values(activities);

	console.log('✅ Database seeded successfully!');
	console.log(`Created ${insertedCategories.length} categories and ${activities.length} activities`);
}

seed().catch((error) => {
	console.error('❌ Error seeding database:', error);
	process.exit(1);
});