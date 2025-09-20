import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { activity, activityCategory, category, user } from './schema';

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

	// Create a default user for seeded data
	console.log('Creating default user...');
	const defaultUser = {
		id: 'default-user',
		name: 'Demo User',
		email: 'demo@example.com',
		emailVerified: true,
		image: null
	};

	const insertedUsers = await db.insert(user).values(defaultUser).returning();
	const defaultUserId = insertedUsers[0].id;

	// Create example categories
	const categories = [
		{
			name: 'Work',
			color: '#3B82F6', // Blue
			icon: '💼',
			userId: defaultUserId
		},
		{
			name: 'Health & Fitness',
			color: '#10B981', // Green
			icon: '💪',
			userId: defaultUserId
		},
		{
			name: 'Learning',
			color: '#8B5CF6', // Purple
			icon: '📚',
			userId: defaultUserId
		},
		{
			name: 'Personal',
			color: '#F59E0B', // Amber
			icon: '🏠',
			userId: defaultUserId
		},
		{
			name: 'Creative',
			color: '#EF4444', // Red
			icon: '🎨',
			userId: defaultUserId
		},
		{
			name: 'Social',
			color: '#EC4899', // Pink
			icon: '👥',
			userId: defaultUserId
		}
	];

	console.log('Creating categories...');
	const insertedCategories = await db.insert(category).values(categories).returning();

	// Create example activities for each category
	const activities = [
		// Work activities
		{
			name: 'Deep Work Session',
			icon: '💻',
			dailyGoal: 240, // 4 hours
			weeklyGoal: 1200, // 20 hours
			monthlyGoal: 4800, // 80 hours
			userId: defaultUserId
		},
		{
			name: 'Email & Communication',
			icon: '📧',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			userId: defaultUserId
		},
		{
			name: 'Meetings',
			icon: '🤝',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			userId: defaultUserId
		},

		// Health & Fitness activities
		{
			name: 'Morning Exercise',
			icon: '🏃‍♂️',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			userId: defaultUserId
		},
		{
			name: 'Meditation',
			icon: '🧘‍♀️',
			dailyGoal: 20, // 20 minutes
			weeklyGoal: 140, // 2 hours 20 minutes
			monthlyGoal: 600, // 10 hours
			userId: defaultUserId
		},
		{
			name: 'Healthy Meal Prep',
			icon: '🥗',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			userId: defaultUserId
		},

		// Learning activities
		{
			name: 'Reading Technical Books',
			icon: '📚',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			userId: defaultUserId
		},
		{
			name: 'Online Courses',
			icon: '🎓',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			userId: defaultUserId
		},
		{
			name: 'Practice Coding',
			icon: '⌨️',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 450, // 7.5 hours
			monthlyGoal: 1800, // 30 hours
			userId: defaultUserId
		},

		// Personal activities
		{
			name: 'Household Chores',
			icon: '🧹',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			userId: defaultUserId
		},
		{
			name: 'Personal Finance',
			icon: '💰',
			dailyGoal: 15, // 15 minutes
			weeklyGoal: 60, // 1 hour
			monthlyGoal: 240, // 4 hours
			userId: defaultUserId
		},
		{
			name: 'Journaling',
			icon: '📔',
			dailyGoal: 10, // 10 minutes
			weeklyGoal: 70, // ~1 hour 10 minutes
			monthlyGoal: 300, // 5 hours
			userId: defaultUserId
		},

		// Creative activities
		{
			name: 'Writing',
			icon: '✍️',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			userId: defaultUserId
		},
		{
			name: 'Digital Art',
			icon: '🎨',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 360, // 6 hours
			monthlyGoal: 1440, // 24 hours
			userId: defaultUserId
		},
		{
			name: 'Music Practice',
			icon: '🎵',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 225, // 3.75 hours
			monthlyGoal: 900, // 15 hours
			userId: defaultUserId
		},

		// Social activities
		{
			name: 'Family Time',
			icon: '👨‍👩‍👧‍👦',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			userId: defaultUserId
		},
		{
			name: 'Friend Calls',
			icon: '📞',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 150, // 2.5 hours
			monthlyGoal: 600, // 10 hours
			userId: defaultUserId
		},
		{
			name: 'Networking',
			icon: '🌐',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 180, // 3 hours
			monthlyGoal: 720, // 12 hours
			userId: defaultUserId
		}
	];

	console.log('Creating activities...');
	const insertedActivities = await db.insert(activity).values(activities).returning();

	// Create activity-category relationships
	console.log('Creating activity-category relationships...');
	const activityCategoryRelationships = [
		// Work activities -> Work category
		{ activityId: insertedActivities[0].id, categoryId: insertedCategories[0].id }, // Deep Work Session
		{ activityId: insertedActivities[1].id, categoryId: insertedCategories[0].id }, // Email & Communication
		{ activityId: insertedActivities[2].id, categoryId: insertedCategories[0].id }, // Meetings

		// Health & Fitness activities -> Health category
		{ activityId: insertedActivities[3].id, categoryId: insertedCategories[1].id }, // Morning Exercise
		{ activityId: insertedActivities[4].id, categoryId: insertedCategories[1].id }, // Meditation
		{ activityId: insertedActivities[5].id, categoryId: insertedCategories[1].id }, // Healthy Meal Prep

		// Learning activities -> Learning category
		{ activityId: insertedActivities[6].id, categoryId: insertedCategories[2].id }, // Reading Technical Books
		{ activityId: insertedActivities[7].id, categoryId: insertedCategories[2].id }, // Online Courses
		{ activityId: insertedActivities[8].id, categoryId: insertedCategories[2].id }, // Practice Coding

		// Personal activities -> Personal category
		{ activityId: insertedActivities[9].id, categoryId: insertedCategories[3].id }, // Household Chores
		{ activityId: insertedActivities[10].id, categoryId: insertedCategories[3].id }, // Personal Finance
		{ activityId: insertedActivities[11].id, categoryId: insertedCategories[3].id }, // Journaling

		// Creative activities -> Creative category
		{ activityId: insertedActivities[12].id, categoryId: insertedCategories[4].id }, // Writing
		{ activityId: insertedActivities[13].id, categoryId: insertedCategories[4].id }, // Digital Art
		{ activityId: insertedActivities[14].id, categoryId: insertedCategories[4].id }, // Music Practice

		// Social activities -> Social category
		{ activityId: insertedActivities[15].id, categoryId: insertedCategories[5].id }, // Family Time
		{ activityId: insertedActivities[16].id, categoryId: insertedCategories[5].id }, // Friend Calls
		{ activityId: insertedActivities[17].id, categoryId: insertedCategories[5].id } // Networking
	];

	await db.insert(activityCategory).values(
		activityCategoryRelationships.map((rel) => ({
			...rel,
			userId: defaultUserId
		}))
	);

	console.log('✅ Database seeded successfully!');
	console.log(`Created default user: ${defaultUser.name} (${defaultUser.email})`);
	console.log(
		`Created ${insertedCategories.length} categories, ${activities.length} activities, and ${activityCategoryRelationships.length} activity-category relationships`
	);
}

seed().catch((error) => {
	console.error('❌ Error seeding database:', error);
	process.exit(1);
});
