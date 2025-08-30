<script lang="ts">
	import { goto } from '$app/navigation';
	import { signUp } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;

	async function handleSignup() {
		if (!name || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await signUp.email({
				email,
				password,
				name
			});

			if (result.error) {
				error = result.error.message || 'Signup failed';
			} else {
				goto('/');
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Signup error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto w-full max-w-md space-y-6">
	<div class="text-center">
		<h1 class="text-2xl font-bold">Create an account</h1>
		<p class="text-muted-foreground">Enter your details to get started</p>
	</div>

	<form on:submit|preventDefault={handleSignup} class="space-y-4">
		<div class="space-y-2">
			<Label for="name">Full Name</Label>
			<Input
				id="name"
				type="text"
				bind:value={name}
				placeholder="Enter your full name"
				required
				disabled={loading}
			/>
		</div>

		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input
				id="email"
				type="email"
				bind:value={email}
				placeholder="Enter your email"
				required
				disabled={loading}
			/>
		</div>

		<div class="space-y-2">
			<Label for="password">Password</Label>
			<Input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Create a password"
				required
				disabled={loading}
			/>
		</div>

		<div class="space-y-2">
			<Label for="confirmPassword">Confirm Password</Label>
			<Input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm your password"
				required
				disabled={loading}
			/>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
				{error}
			</div>
		{/if}

		<Button type="submit" class="w-full" disabled={loading}>
			{loading ? 'Creating account...' : 'Create account'}
		</Button>
	</form>

	<div class="text-center text-sm">
		<span class="text-muted-foreground">Already have an account?</span>
		<a href="/login" class="text-primary hover:underline">Sign in</a>
	</div>
</div>
