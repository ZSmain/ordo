import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
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
    confirmPassword: v.pipe(v.string(), v.minLength(6, 'Confirm Password must be at least 6 characters long')),
});

export const login = form(async (data) => {
    const formData = {
        email: data.get('email'),
        password: data.get('password'),
        redirectTo: data.get('redirectTo') as string
    };

    const result = v.safeParse(loginSchema, { email: formData.email, password: formData.password });

    if (!result.success) {
        return { success: false, message: v.flatten(result.issues) };
    }

    const { email, password } = result.output;

    try {
        await auth.api.signInEmail({
            body: {
                email: email as string,
                password: password as string
            },
            headers: getRequestEvent().request.headers
        });
    } catch (error: any) {
        return { success: false, message: error?.message ?? 'Login failed' };
    }

    // Redirect to the intended page upon successful login
    redirect(303, formData.redirectTo);
});

export const signup = form(async (data) => {
    const formData = {
        name: data.get('name'),
        email: data.get('email'),
        password: data.get('password'),
        confirmPassword: data.get('confirmPassword')
    };

    const result = v.safeParse(signupSchema, formData);

    if (!result.success) {
        const errors = v.flatten(result.issues).nested;

        const fieldErrors = Object.fromEntries(
            Object.entries(errors).map(([key, value]) => [key, value.join(', ')])
        );

        return { success: false, errors: fieldErrors };
    }

    const { name, email, password } = result.output;

    try {
        await auth.api.signUpEmail({
            body: {
                name,
                email,
                password
            },
            headers: getRequestEvent().request.headers
        });
    } catch (error: any) {
        return { success: false, message: error?.message ?? 'Failed to create account' };
    }

    // Redirect to the main app on successful signup
    redirect(303, '/');
});