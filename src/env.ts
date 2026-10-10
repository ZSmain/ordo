import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { schema: (input) => input ?? '' },
	ORIGIN: { schema: (input) => input ?? '' },
	BETTER_AUTH_SECRET: { schema: (input) => input ?? '' },
	GOOGLE_CLIENT_ID: { schema: (input) => input ?? '' },
	GOOGLE_CLIENT_SECRET: { schema: (input) => input ?? '' },
	PASSWORD_HASH_ITERATIONS: { schema: (input) => input ?? '' },
	PASSWORD_HASH_KEY_LENGTH: { schema: (input) => input ?? '' },
	PASSWORD_HASH_SALT_LENGTH: { schema: (input) => input ?? '' }
});
