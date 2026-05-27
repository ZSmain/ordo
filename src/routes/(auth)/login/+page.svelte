<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	type LoginFormData = {
		action?: 'signInEmail' | 'signInSocial';
		message?: string;
		values?: {
			email?: string;
			redirectTo?: string;
		};
		errors?: {
			email?: string[];
			password?: string[];
		};
	};

	let { form }: { form: LoginFormData | null } = $props();

	let redirectTo = $derived(
		form?.values?.redirectTo || page.url.searchParams.get('redirectTo') || '/'
	);
</script>

<svelte:head>
	<title>Sign In - Ordo</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href={resolve('/')} class="flex items-center gap-2 self-center font-medium"> Ordo </a>

		<div class="flex flex-col gap-6">
			<Card.Root>
				<Card.Header class="text-center">
					<Card.Title class="text-xl">Welcome back</Card.Title>
					<Card.Description>Login with your Google account</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-6">
						<div class="flex flex-col gap-4">
							<form method="POST" action="?/signInSocial" use:enhance>
								<input type="hidden" name="provider" value="google" />
								<input type="hidden" name="redirectTo" value={redirectTo} />
								<Button type="submit" variant="outline" class="w-full">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									Login with Google
								</Button>
							</form>

							{#if form?.action === 'signInSocial' && form.message}
								<div
									class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
								>
									{form.message}
								</div>
							{/if}
						</div>
						<div
							class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
						>
							<span class="relative z-10 bg-card px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
						<form method="POST" action="?/signInEmail" use:enhance>
							<input type="hidden" name="redirectTo" value={redirectTo} />
							<div class="grid gap-6">
								<div class="grid gap-3">
									<Label for="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={form?.values?.email ?? ''}
										placeholder="Enter your email"
										required
									/>
									{#each form?.errors?.email ?? [] as message, index (`${message}-${index}`)}
										<p class="text-sm text-red-600 dark:text-red-400">{message}</p>
									{/each}
								</div>
								<div class="grid gap-3">
									<div class="flex items-center">
										<Label for="password">Password</Label>
									</div>
									<Input
										id="password"
										name="password"
										type="password"
										placeholder="Enter your password"
										required
									/>
									{#each form?.errors?.password ?? [] as message, index (`${message}-${index}`)}
										<p class="text-sm text-red-600 dark:text-red-400">{message}</p>
									{/each}
								</div>

								{#if form?.action === 'signInEmail' && form.message}
									<div
										class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
									>
										{form.message}
									</div>
								{/if}

								<Button type="submit" class="w-full">Login</Button>
							</div>
						</form>
						<div class="text-center text-sm">
							Don't have an account?
							<a href={resolve('/signup')} class="underline underline-offset-4"> Sign up </a>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
