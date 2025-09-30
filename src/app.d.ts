// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: DrizzleClient;
			auth: BetterAuth;
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
			};
			user?: {
				id: string;
				email: string;
				name: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
			};
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Env;
		}
	}
}

export {};
