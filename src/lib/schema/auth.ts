import * as v from 'valibot';

export const loginSchema = v.object({
    email: v.pipe(v.string(), v.email('Please provide a valid email address')),
    password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
    redirectTo: v.optional(v.string())
});

export const signupSchema = v.object({
    name: v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters long')),
    email: v.pipe(v.string(), v.email('Please provide a valid email address')),
    password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters long')),
    confirmPassword: v.pipe(
        v.string(),
        v.minLength(6, 'Confirm Password must be at least 6 characters long')
    )
});

export const googleSignInSchema = v.object({
    provider: v.literal('google'),
    redirectTo: v.optional(v.string())
});

