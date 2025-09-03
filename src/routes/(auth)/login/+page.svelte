<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { login } from '../auth.remote';

	let redirectTo = $derived(page.url.searchParams.get('redirectTo') || '/');
</script>

<svelte:head>
	<title>Sign In - Ordo</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto w-full max-w-md space-y-6">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Welcome back</h1>
			<p class="text-muted-foreground">Sign in to your account</p>
		</div>

		<form {...login} class="space-y-4">
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input id="email" name="email" type="email" placeholder="Enter your email" required />
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="Enter your password"
					required
				/>
			</div>

			{#if login.result?.message}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{login.result.message}
				</div>
			{/if}

			<Button type="submit" class="w-full">
				{login.pending ? 'Signing in...' : 'Sign In'}
			</Button>
		</form>

		<div class="text-center text-sm">
			<span class="text-muted-foreground">Don't have an account?</span>
			<a href="/signup" class="text-primary hover:underline">Sign up</a>
		</div>
	</div>
</div>
