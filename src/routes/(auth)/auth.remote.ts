import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';


export const login = form(async (data) => {
    const email = data.get('email');
    const password = data.get('password');
    const redirectTo = (data.get('redirectTo') as string) || '/';

    try {
        await auth.api.signInEmail({
            body: {
                email: email as string,
                password: password as string
            },
            headers: getRequestEvent().request.headers
        });
    } catch (error: any) {
        return { success: false, message: error?.message };
    }

    // Redirect to the intended page upon successful login
    redirect(303, redirectTo);
});

export const signup = form(async (data) => {
    const name = data.get('name');
    const email = data.get('email');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
        throw new Error('All fields are required');
    }

    if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
    }

    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    try {
        const event = getRequestEvent();

        const result = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password
            },
            headers: event.request.headers
        });

        if (!result || !result.user) {
            throw new Error('Failed to create account');
        }

        // Redirect to the main app on successful signup
        redirect(303, '/');
    } catch (error) {
        // Check if this is a redirect (successful signup)
        // SvelteKit redirects have status and location properties
        if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
            throw error; // Re-throw redirect objects
        }

        // Check for Error objects with redirect-related messages
        if (error instanceof Error && (error.message.includes('redirect') || error.name === 'Redirect')) {
            throw error; // Re-throw redirect errors
        }

        // Extract more specific error message from Better Auth
        if (error instanceof Error && error.message.includes('Email already exists')) {
            throw new Error('An account with this email already exists');
        }

        if (error instanceof Error && error.message.includes('Invalid email')) {
            throw new Error('Please enter a valid email address');
        }

        // Log the actual error for debugging
        console.error('Signup error:', error);

        throw new Error('Failed to create account. Please try again.');
    }
});