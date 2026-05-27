import { googleSignInSchema, signupSchema } from '$lib/schema/auth';
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
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const values = {
			name: readFormString(formData, 'name'),
			email: readFormString(formData, 'email'),
			password: readFormString(formData, 'password'),
			confirmPassword: readFormString(formData, 'confirmPassword'),
			redirectTo: getSafeRedirectTo(readFormString(formData, 'redirectTo'), '/')
		};

		const result = v.safeParse(signupSchema, values);
		if (!result.success) {
			const { message, errors } = flattenValidation(result.issues);
			return fail(400, {
				action: 'signUpEmail',
				message,
				errors,
				values: {
					name: values.name,
					email: values.email,
					redirectTo: values.redirectTo
				}
			});
		}

		if (result.output.password !== result.output.confirmPassword) {
			return fail(400, {
				action: 'signUpEmail',
				message: 'Passwords do not match',
				errors: {
					confirmPassword: ['Passwords do not match']
				},
				values: {
					name: values.name,
					email: values.email,
					redirectTo: values.redirectTo
				}
			});
		}

		try {
			await event.locals.auth.api.signUpEmail({
				body: {
					name: result.output.name,
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
				action: 'signUpEmail',
				message: getAuthErrorMessage(error, 'Failed to create account'),
				values: {
					name: result.output.name,
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
