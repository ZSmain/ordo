# Ordo - Time Tracking App

A simple time tracking application inspired by "Simple Time Tracker" mobile application.

## Features

- 📊 Track time spent on various activities
- 📁 Organize activities into multiple categories
- 🎯 Set daily, weekly, and monthly goals
- 📈 View detailed statistics and progress
- 🔍 Search and filter categories when creating/editing activities

## Tech Stack

- **Frontend**: Svelte/SvelteKit, Tailwind CSS & Shadcn-svelte
- **Backend**: SvelteKit remote functions
- **Database**: Cloudflare D1 (LibSQL) with Drizzle ORM
- **Authentication**: Better Auth
- **Validation**: Valibot

## Activity Management

- **Multi-Category Support**: Activities can now belong to multiple categories simultaneously
- **Enhanced Category Selection**: When creating or editing activities, you can:
  - Select multiple categories using checkboxes
  - Search through categories with a built-in search filter
  - View selected categories as visual badges
- **Improved User Experience**: Better accessibility with keyboard navigation and ARIA attributes

## Getting Started

1. **Install dependencies:**

   ```sh
   pnpm install
   ```

2. **Set up environment variables:**

   Create a `.env` file with:

   ```bash
   DATABASE_URL=your_database_url
   # Add other required environment variables for authentication
   BETTER_AUTH_SECRET=your_better_auth_secret
   BETTER_AUTH_URL=https://your-app-domain

   # Optional tuning for password hashing (defaults work for local dev)
   # Lower the iteration count if Cloudflare Workers report CPU limit errors
   PASSWORD_HASH_ITERATIONS=60000
   PASSWORD_HASH_KEY_LENGTH=32
   PASSWORD_HASH_SALT_LENGTH=16
   ```

   When deploying to Cloudflare Pages + D1, keep the iteration count between
   40,000 and 80,000 to stay under the worker CPU budget while maintaining
   strong hashing. Increase gradually if you observe low CPU usage.

3. **Push database schema:**

   ```sh
   pnpm run db:push
   ```

4. **Start the development server:**

   ```sh
   pnpm run dev
   ```

## Database Commands

- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:generate` - Generate migration files
- `pnpm run db:migrate` - Run pending migrations
- `pnpm run db:studio` - Open Drizzle Studio

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with:

```sh
pnpm run preview
```
