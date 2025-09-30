<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut, useSession } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import { TriangleAlert, LogOut, Trash2, User } from '@lucide/svelte';
	import { deleteUserAccount } from './settings.remote';

	const session = useSession();
	let isDeleteDialogOpen = $state(false);
	let isDeleting = $state(false);
	let deleteError = $state('');

	async function handleSignOut() {
		try {
			await signOut();
			// Force a full page reload to clear any client state
			goto('/login');
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}

	async function handleDeleteAccount() {
		if (!$session.data?.user?.id) return;

		isDeleting = true;
		deleteError = '';

		try {
			await deleteUserAccount($session.data.user.id);
			// Sign out and redirect after successful deletion
			await signOut();
			goto('/login');
		} catch (error) {
			console.error('Delete account error:', error);
			deleteError = error instanceof Error ? error.message : 'Failed to delete account';
		} finally {
			isDeleting = false;
		}
	}

	function closeDeleteDialog() {
		isDeleteDialogOpen = false;
		deleteError = '';
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
			<div class="rounded-lg border border-gray-200 bg-white p-4">
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
		<div class="space-y-3">
			<Button
				variant="outline"
				onclick={handleSignOut}
				class="flex h-9 w-full items-center justify-center gap-2"
			>
				<LogOut class="h-4 w-4" />
				Sign Out
			</Button>

			<Dialog.Root bind:open={isDeleteDialogOpen}>
				<Dialog.Trigger
					class="text-destructive-foreground inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-transparent bg-destructive px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-destructive/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					<Trash2 class="h-4 w-4" />
					Delete Account
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-md">
					<Dialog.Header>
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
								<TriangleAlert class="h-5 w-5 text-red-600" />
							</div>
							<div>
								<Dialog.Title class="text-left">Delete Account</Dialog.Title>
								<Dialog.Description class="text-left">
									This action cannot be undone.
								</Dialog.Description>
							</div>
						</div>
					</Dialog.Header>
					<div class="py-4">
						<div class="rounded-lg bg-red-50 p-4">
							<h4 class="mb-2 font-semibold text-red-900">This will permanently delete:</h4>
							<ul class="space-y-1 text-sm text-red-800">
								<li>• Your account and profile information</li>
								<li>• All your categories and activities</li>
								<li>• All your time tracking sessions</li>
								<li>• All your statistics and progress data</li>
							</ul>
						</div>
						{#if deleteError}
							<div class="mt-4 rounded-lg bg-red-100 p-3">
								<p class="text-sm text-red-800">{deleteError}</p>
							</div>
						{/if}
					</div>
					<Dialog.Footer class="gap-2">
						<Button variant="outline" onclick={closeDeleteDialog} disabled={isDeleting}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onclick={handleDeleteAccount}
							disabled={isDeleting}
							class="flex items-center gap-2"
						>
							{#if isDeleting}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
								Deleting...
							{:else}
								<Trash2 class="h-4 w-4" />
								Delete Account
							{/if}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
</div>
