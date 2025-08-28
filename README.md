# Ordo - Time Tracking App

A simple time tracking application inspired by "Simple Time Tracker" mobile application.

## Features

- 📊 Track time spent on various activities
- 📁 Organize activities into categories
- 🎯 Set daily, weekly, and monthly goals
- 📈 View detailed statistics and progress

## Tech Stack

- **Frontend**: Svelte/SvelteKit, Tailwind CSS & Shadcn-svelte
- **Backend**: SvelteKit remote functions
- **Database**:  Cloudflare D1 (LibSQL) with Drizzle ORM
- **Authentication**: Better Auth
- **Validation**: Valibot

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
   ```

3. **Push database schema:**

   ```sh
   pnpm run db:push
   ```

4. **Seed the database with example data:**

   ```sh
   pnpm run db:seed
   ```

5. **Start the development server:**

   ```sh
   pnpm run dev
   ```

## Database Commands

- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:generate` - Generate migration files
- `pnpm run db:migrate` - Run pending migrations
- `pnpm run db:studio` - Open Drizzle Studio
- `pnpm run db:seed` - Seed database with example data

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with:

```sh
pnpm run preview
```
