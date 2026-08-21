<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import ModeToggle from '$lib/components/ui/ModeToggle.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { LogOut, Trash2, TriangleAlert, User } from '@lucide/svelte';
	import type { PageData } from './$types';

	type SettingsFormData = {
		action?: 'signOut' | 'deleteAccount';
		message?: string;
	};

	let { data, form }: { data: PageData; form: SettingsFormData | null } = $props();

	let isDeleteDialogOpen = $state(false);

	function closeDeleteDialog() {
		isDeleteDialogOpen = false;
	}
</script>

<svelte:head>
	<title>Ordo - Settings</title>
</svelte:head>

<div class="p-4">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Page Header -->
		<div>
			<h1 class="text-2xl font-bold text-foreground">Settings</h1>
			<p class="text-sm text-muted-foreground">Manage your account and preferences</p>
		</div>

		<!-- User Profile Section -->
		{#if data.user}
			<div class="rounded-lg border border-border p-4">
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground"
					>
						<User class="h-6 w-6" />
					</div>
					<div>
						<h2 class="text-lg font-semibold text-foreground">{data.user.name || 'User'}</h2>
						<p class="text-sm text-muted-foreground">{data.user.email}</p>
						<p class="text-xs text-muted-foreground">
							Member since {new Date(data.user.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<Separator />

		<!-- Appearance Section -->
		<div class="space-y-3">
			<h3 class="text-lg font-medium text-foreground">Appearance</h3>
			<div class="flex items-center justify-between rounded-lg border border-border p-4">
				<div class="space-y-0.5">
					<div class="text-sm font-medium text-foreground">Theme</div>
					<div class="text-xs text-muted-foreground">Switch between light and dark themes</div>
				</div>
				<ModeToggle />
			</div>
		</div>

		<Separator />

		<!-- Account Actions -->
		<div class="space-y-3">
			<form method="POST" action="?/signOut" use:enhance>
				<Button
					variant="outline"
					type="submit"
					class="flex h-9 w-full items-center justify-center gap-2"
				>
					<LogOut />
					Sign Out
				</Button>
			</form>

			{#if form?.action === 'signOut' && form.message}
				<div class="rounded-lg bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{form.message}</p>
				</div>
			{/if}

			<Dialog.Root bind:open={isDeleteDialogOpen}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="destructive" class="w-full">
							<Trash2 />
							Delete Account
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-md">
					<Dialog.Header>
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10"
							>
								<TriangleAlert class="h-5 w-5 text-destructive" />
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
						<div class="rounded-lg bg-destructive/10 p-4">
							<h4 class="mb-2 font-semibold text-destructive">This will permanently delete:</h4>
							<ul class="list-inside list-disc space-y-1 text-sm text-destructive">
								<li>Your account and profile information</li>
								<li>All your categories and activities</li>
								<li>All your time tracking sessions</li>
								<li>All your statistics and progress data</li>
							</ul>
						</div>
						{#if form?.action === 'deleteAccount' && form.message}
							<div class="mt-4 rounded-lg bg-destructive/10 p-3">
								<p class="text-sm text-destructive">{form.message}</p>
							</div>
						{/if}
					</div>
					<form method="POST" action="?/deleteAccount" use:enhance class="contents">
						<Dialog.Footer class="gap-2">
							<Button variant="outline" type="button" onclick={closeDeleteDialog}>Cancel</Button>
							<Button variant="destructive" type="submit">
								<Trash2 />
								Delete Account
							</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
</div>
