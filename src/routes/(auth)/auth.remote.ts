import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';


export const login = form(async (data) => {
    const email = data.get('email');
    const password = data.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error('Email and password are required');
    }

    if (!email || !password) {
        throw new Error('Please fill in all fields');
    }

    try {
        const event = getRequestEvent();

        const result = await auth.api.signInEmail({
            body: {
                email,
                password
            },
            headers: event.request.headers
        });

        if (!result || !result.user) {
            throw new Error('Invalid credentials');
        }

        // Redirect to the main app on successful login
        redirect(303, '/');
    } catch (error) {
        if (error instanceof Error && error.message.includes('redirect')) {
            throw error; // Re-throw redirect errors
        }
        throw new Error('Login failed. Please check your credentials.');
    }
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
        if (error instanceof Error && error.message.includes('redirect')) {
            throw error; // Re-throw redirect errors
        }
        throw new Error('Failed to create account. Please try again.');
    }
});