<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { signup } from '../auth.remote';
</script>

<svelte:head>
	<title>Sign Up - Ordo</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href="/" class="flex items-center gap-2 self-center font-medium"> Ordo </a>

		<div class="flex flex-col gap-6">
			<Card.Root>
				<Card.Header class="text-center">
					<Card.Title class="text-xl">Create an account</Card.Title>
					<Card.Description>Sign up with your Google account</Card.Description>
				</Card.Header>
				<Card.Content>
					<form {...signup}>
						<div class="grid gap-6">
							<div class="flex flex-col gap-4">
								<Button variant="outline" class="w-full">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									Sign up with Google
								</Button>
							</div>
							<div
								class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
							>
								<span class="relative z-10 bg-card px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>

							<div class="grid gap-6">
								<div class="grid gap-3">
									<Label for="name">Full name</Label>
									<Input
										id="name"
										name={signup.field('name')}
										type="text"
										placeholder="Your full name"
										required
									/>
									{#if signup.result?.message?.name}
										<p class="text-sm text-red-600">{signup.result.message.name}</p>
									{/if}
								</div>

								<div class="grid gap-3">
									<Label for="email">Email</Label>
									<Input
										id="email"
										name={signup.field('email')}
										type="email"
										placeholder="Enter your email"
										required
									/>
									{#if signup.result?.message?.email}
										<p class="text-sm text-red-600">{signup.result.message.email}</p>
									{/if}
								</div>

								<div class="grid gap-3">
									<Label for="password">Password</Label>
									<Input
										id="password"
										name={signup.field('password')}
										type="password"
										placeholder="Create a password"
										required
									/>
									{#if signup.result?.message?.password}
										<p class="text-sm text-red-600">{signup.result.message.password}</p>
									{/if}
								</div>

								<div class="grid gap-3">
									<Label for="confirmPassword">Confirm password</Label>
									<Input
										id="confirmPassword"
										name={signup.field('confirmPassword')}
										type="password"
										placeholder="Confirm your password"
										required
									/>
									{#if signup.result?.message?.confirmPassword}
										<p class="text-sm text-red-600">{signup.result.message.confirmPassword}</p>
									{/if}
								</div>

								{#if signup.result?.message && !(typeof signup.result.message === 'object')}
									<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
										{signup.result.message}
									</div>
								{/if}

								{#each signup.result?.message as error}
									<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
										{error}
									</div>
								{/each}

								<Button type="submit" class="w-full" disabled={!!signup.pending}>
									{signup.pending ? 'Creating account...' : 'Create account'}
								</Button>
							</div>

							<div class="text-center text-sm">
								Already have an account?
								<a href="/login" class="underline underline-offset-4"> Sign in </a>
							</div>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
