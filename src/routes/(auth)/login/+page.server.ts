import { googleSignInSchema, loginSchema } from '$lib/schema/auth';
import {
	flattenValidation,
	getAuthErrorMessage,
	getSafeRedirectTo,
	isRedirectLike,
	readFormString,
	resolveSocialRedirectUrl
} from '$lib/server/auth-actions';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Actions } from './$types';

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const values = {
			email: readFormString(formData, 'email'),
			password: readFormString(formData, 'password'),
			redirectTo: getSafeRedirectTo(readFormString(formData, 'redirectTo'), '/')
		};

		const result = v.safeParse(loginSchema, values);
		if (!result.success) {
			const { message, errors } = flattenValidation(result.issues);
			return fail(400, {
				action: 'signInEmail',
				message,
				errors,
				values: {
					email: values.email,
					redirectTo: values.redirectTo
				}
			});
		}

		try {
			await event.locals.auth.api.signInEmail({
				body: {
					email: result.output.email,
					password: result.output.password
				},
				headers: event.request.headers
			});
		} catch (error) {
			if (isRedirectLike(error)) {
				throw error;
			}

			return fail(400, {
				action: 'signInEmail',
				message: getAuthErrorMessage(error, 'Login failed'),
				values: {
					email: result.output.email,
					redirectTo: values.redirectTo
				}
			});
		}

		throw redirect(303, values.redirectTo);
	},
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const values = {
			provider: readFormString(formData, 'provider') || 'google',
			redirectTo: getSafeRedirectTo(readFormString(formData, 'redirectTo'), '/')
		};

		const result = v.safeParse(googleSignInSchema, {
			provider: values.provider,
			redirectTo: values.redirectTo
		});
		if (!result.success) {
			const { message } = flattenValidation(result.issues, 'Google sign-in failed');
			return fail(400, {
				action: 'signInSocial',
				message,
				values: {
					redirectTo: values.redirectTo
				}
			});
		}

		try {
			const socialResult = await event.locals.auth.api.signInSocial({
				body: {
					provider: result.output.provider,
					callbackURL: values.redirectTo
				},
				headers: event.request.headers
			});

			const redirectUrl = await resolveSocialRedirectUrl(socialResult);
			if (!redirectUrl) {
				return fail(400, {
					action: 'signInSocial',
					message: 'Google sign-in failed',
					values: {
						redirectTo: values.redirectTo
					}
				});
			}

			throw redirect(303, redirectUrl);
		} catch (error) {
			if (isRedirectLike(error)) {
				throw error;
			}

			return fail(400, {
				action: 'signInSocial',
				message: getAuthErrorMessage(error, 'Google sign-in failed'),
				values: {
					redirectTo: values.redirectTo
				}
			});
		}
	}
};
