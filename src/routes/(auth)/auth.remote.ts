import { command, form, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const loginSchema = v.object({
	email: v.pipe(v.string(), v.email('Please provide a valid email address')),
	password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
	redirectTo: v.optional(v.string())
});

const signupSchema = v.object({
	name: v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters long')),
	email: v.pipe(v.string(), v.email('Please provide a valid email address')),
	password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
	confirmPassword: v.pipe(
		v.string(),
		v.minLength(6, 'Confirm Password must be at least 6 characters long')
	)
});

export const login = form(
	loginSchema,
	async ({ email, password, redirectTo }) => {
		const event = getRequestEvent();
		const { auth } = event.locals;

		try {
			await auth.api.signInEmail({
				body: {
					email: email as string,
					password: password as string
				},
				headers: event.request.headers
			});
		} catch (error) {
			console.error("Login error:", error);
			const msg = error instanceof Error ? error.message : 'Login failed';
			return { success: false, message: msg };
		}

		// Redirect to the intended page upon successful login
		redirect(303, redirectTo as string || '/');
	});

export const signup = form((signupSchema),
	async ({ name, email, password, confirmPassword }) => {
		if (password !== confirmPassword) {
			return { success: false, message: 'Passwords do not match' };
		}

		const event = getRequestEvent();
		const { auth } = event.locals;

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					email,
					password
				},
				headers: event.request.headers
			});
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to create account';
			return { success: false, message: msg };
		}

		// Redirect to the main app on successful signup
		redirect(303, '/');
	});

export const logout = command(async () => {
	const event = getRequestEvent();
	const { auth } = event.locals;

	try {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return { success: true };
	} catch (error: unknown) {
		// "Failed to get session" after signOut is expected - the session was cleared successfully
		const errorBody = error && typeof error === 'object' && 'body' in error
			? (error.body as { code?: string })
			: null;

		const isSessionError = error instanceof Error &&
			(error.message.includes('Failed to get session') ||
				errorBody?.code === 'FAILED_TO_GET_SESSION');

		if (isSessionError) {
			return { success: true };
		}

		console.error('Sign out error:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Sign out failed' };
	}
});

const googleSignInSchema = v.object({
	provider: v.literal('google'),
	redirectTo: v.optional(v.string())
});

export const loginWithGoogle = form(
	googleSignInSchema,
	async ({ provider, redirectTo }) => {
		const event = getRequestEvent();
		const { auth } = event.locals;

		try {
			const result = await auth.api.signInSocial({
				body: { provider },
				headers: event.request.headers
			});

			// Try to extract redirect URL from various response formats
			let redirectUrl: string | null = null;

			if (result instanceof Response) {
				redirectUrl = result.headers.get('location');

				// If no location header, try parsing JSON body
				if (!redirectUrl) {
					const contentType = result.headers.get('content-type') ?? '';
					if (contentType.includes('application/json')) {
						try {
							const data = await result.json() as Record<string, unknown>;
							redirectUrl = (data?.location || data?.url) as string | null;
						} catch {
							// Failed to parse JSON, continue with fallback
						}
					}
				}
			} else if (result && typeof result === 'object') {
				const data = result as Record<string, unknown>;
				redirectUrl = (data.location || data.url) as string | null;
			}

			// Redirect to discovered URL or fallback
			redirect(303, redirectUrl || redirectTo || '/');
		} catch (error) {
			// Re-throw SvelteKit redirects
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}
			console.error('Google sign-in error:', error);
			const message = error instanceof Error ? error.message : 'Google sign-in failed';
			return { success: false, message };
		}
	}
);
