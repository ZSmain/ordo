<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { signup } from '../auth.remote';

	let errorMessage = $state('');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Sign Up - Ordo</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto w-full max-w-md space-y-6">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Create an account</h1>
			<p class="text-muted-foreground">Enter your details to get started</p>
		</div>

		<form
			{...signup.enhance(async ({ submit }) => {
				try {
					errorMessage = '';
					isSubmitting = true;
					await submit();
				} catch (error) {
					errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
				} finally {
					isSubmitting = false;
				}
			})}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="name">Full Name</Label>
				<Input
					id="name"
					name="name"
					type="text"
					placeholder="Enter your full name"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="Enter your email"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="Create a password"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="confirmPassword">Confirm Password</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					placeholder="Confirm your password"
					required
					disabled={isSubmitting}
				/>
			</div>

			{#if errorMessage}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{errorMessage}
				</div>
			{/if}

			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Creating account...' : 'Create account'}
			</Button>
		</form>

		<div class="text-center text-sm">
			<span class="text-muted-foreground">Already have an account?</span>
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</div>
	</div>
</div>
