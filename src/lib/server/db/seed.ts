import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { activity, category, user } from './schema';

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
			categoryId: insertedCategories[0].id,
			userId: defaultUserId
		},
		{
			name: 'Email & Communication',
			icon: '📧',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[0].id,
			userId: defaultUserId
		},
		{
			name: 'Meetings',
			icon: '🤝',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			categoryId: insertedCategories[0].id,
			userId: defaultUserId
		},

		// Health & Fitness activities
		{
			name: 'Morning Exercise',
			icon: '🏃‍♂️',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[1].id,
			userId: defaultUserId
		},
		{
			name: 'Meditation',
			icon: '🧘‍♀️',
			dailyGoal: 20, // 20 minutes
			weeklyGoal: 140, // 2 hours 20 minutes
			monthlyGoal: 600, // 10 hours
			categoryId: insertedCategories[1].id,
			userId: defaultUserId
		},
		{
			name: 'Healthy Meal Prep',
			icon: '🥗',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[1].id,
			userId: defaultUserId
		},

		// Learning activities
		{
			name: 'Reading Technical Books',
			icon: '📚',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 210, // 3.5 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[2].id,
			userId: defaultUserId
		},
		{
			name: 'Online Courses',
			icon: '🎓',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[2].id,
			userId: defaultUserId
		},
		{
			name: 'Practice Coding',
			icon: '⌨️',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 450, // 7.5 hours
			monthlyGoal: 1800, // 30 hours
			categoryId: insertedCategories[2].id,
			userId: defaultUserId
		},

		// Personal activities
		{
			name: 'Household Chores',
			icon: '🧹',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[3].id,
			userId: defaultUserId
		},
		{
			name: 'Personal Finance',
			icon: '💰',
			dailyGoal: 15, // 15 minutes
			weeklyGoal: 60, // 1 hour
			monthlyGoal: 240, // 4 hours
			categoryId: insertedCategories[3].id,
			userId: defaultUserId
		},
		{
			name: 'Journaling',
			icon: '📔',
			dailyGoal: 10, // 10 minutes
			weeklyGoal: 70, // ~1 hour 10 minutes
			monthlyGoal: 300, // 5 hours
			categoryId: insertedCategories[3].id,
			userId: defaultUserId
		},

		// Creative activities
		{
			name: 'Writing',
			icon: '✍️',
			dailyGoal: 60, // 1 hour
			weeklyGoal: 300, // 5 hours
			monthlyGoal: 1200, // 20 hours
			categoryId: insertedCategories[4].id,
			userId: defaultUserId
		},
		{
			name: 'Digital Art',
			icon: '🎨',
			dailyGoal: 90, // 1.5 hours
			weeklyGoal: 360, // 6 hours
			monthlyGoal: 1440, // 24 hours
			categoryId: insertedCategories[4].id,
			userId: defaultUserId
		},
		{
			name: 'Music Practice',
			icon: '🎵',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 225, // 3.75 hours
			monthlyGoal: 900, // 15 hours
			categoryId: insertedCategories[4].id,
			userId: defaultUserId
		},

		// Social activities
		{
			name: 'Family Time',
			icon: '👨‍👩‍👧‍👦',
			dailyGoal: 120, // 2 hours
			weeklyGoal: 600, // 10 hours
			monthlyGoal: 2400, // 40 hours
			categoryId: insertedCategories[5].id,
			userId: defaultUserId
		},
		{
			name: 'Friend Calls',
			icon: '📞',
			dailyGoal: 30, // 30 minutes
			weeklyGoal: 150, // 2.5 hours
			monthlyGoal: 600, // 10 hours
			categoryId: insertedCategories[5].id,
			userId: defaultUserId
		},
		{
			name: 'Networking',
			icon: '🌐',
			dailyGoal: 45, // 45 minutes
			weeklyGoal: 180, // 3 hours
			monthlyGoal: 720, // 12 hours
			categoryId: insertedCategories[5].id,
			userId: defaultUserId
		}
	];

	console.log('Creating activities...');
	await db.insert(activity).values(activities);

	console.log('✅ Database seeded successfully!');
	console.log(`Created default user: ${defaultUser.name} (${defaultUser.email})`);
	console.log(`Created ${insertedCategories.length} categories and ${activities.length} activities`);
}

seed().catch((error) => {
	console.error('❌ Error seeding database:', error);
	process.exit(1);
});