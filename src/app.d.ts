declare global {
	namespace App {
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
		interface Platform {
			env: Env;
		}
	}
}

export { };

