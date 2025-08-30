<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await signIn.email({
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Login failed';
			} else {
				goto('/');
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto w-full max-w-md space-y-6">
	<div class="text-center">
		<h1 class="text-2xl font-bold">Welcome back</h1>
		<p class="text-muted-foreground">Sign in to your account</p>
	</div>

	<form on:submit|preventDefault={handleLogin} class="space-y-4">
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
				placeholder="Enter your password"
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
			{loading ? 'Signing in...' : 'Sign in'}
		</Button>
	</form>

	<div class="text-center text-sm">
		<span class="text-muted-foreground">Don't have an account?</span>
		<a href="/signup" class="text-primary hover:underline">Sign up</a>
	</div>
</div>
