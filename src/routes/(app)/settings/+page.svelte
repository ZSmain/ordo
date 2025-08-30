<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut, useSession } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { LogOut, User } from '@lucide/svelte';

	const session = useSession();

	async function handleSignOut() {
		try {
			await signOut();
			// Force a full page reload to clear any client state
			goto('/login');
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}
</script>

<svelte:head>
	<title>Ordo - Settings</title>
</svelte:head>

<div class="p-4">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Page Header -->
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Settings</h1>
			<p class="text-sm text-gray-600">Manage your account and preferences</p>
		</div>

		<!-- User Profile Section -->
		{#if $session.data?.user}
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground"
					>
						<User class="h-6 w-6" />
					</div>
					<div>
						<h2 class="text-lg font-semibold text-gray-900">
							{$session.data.user.name || 'User'}
						</h2>
						<p class="text-sm text-gray-600">{$session.data.user.email}</p>
						<p class="text-xs text-gray-500">
							Member since {new Date($session.data.user.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<Separator />

		<!-- Account Actions -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Account</h3>
			<div class="space-y-4">
				<Button variant="destructive" onclick={handleSignOut} class="flex items-center gap-2">
					<LogOut class="h-4 w-4" />
					Sign Out
				</Button>
			</div>
		</div>
	</div>
</div>
