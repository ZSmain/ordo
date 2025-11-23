<script lang="ts">
	import { deleteCategory } from '$lib/api/data.remote';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import type { Category } from '$lib/types';
	import EditCategory from './EditCategory.svelte';

	interface Props {
		categories: Category[];
		selectedCategoryId: string;
		loading?: boolean;
		error?: Error | null;
		onCategoryChange?: (categoryId: string) => void;
		onCategoryUpdated?: () => void;
		userId?: string;
	}

	let {
		categories,
		selectedCategoryId = $bindable(),
		loading = false,
		error = null,
		onCategoryChange,
		onCategoryUpdated,
		userId = ''
	}: Props = $props();

	let editCategoryOpen = $state(false);
	let categoryToEdit = $state<Category | null>(null);
	let deleteDialogOpen = $state(false);
	let categoryToDelete = $state<Category | null>(null);

	// Handle category selection
	function handleCategoryChange(value: string) {
		selectedCategoryId = value;
		onCategoryChange?.(value);
	}

	// Handle modify category
	function handleModifyCategory(category: Category) {
		categoryToEdit = category;
		editCategoryOpen = true;
	}

	// Handle delete category
	function handleDeleteCategory(category: Category) {
		categoryToDelete = category;
		deleteDialogOpen = true;
	}

	// Confirm delete category
	async function confirmDeleteCategory() {
		if (!userId || !categoryToDelete) return;

		try {
			await deleteCategory({
				id: categoryToDelete.id,
				userId
			});

			// Close dialog and reset state
			deleteDialogOpen = false;
			categoryToDelete = null;

			// Notify parent component to refresh data
			onCategoryUpdated?.();
		} catch (error) {
			console.error('Failed to delete category:', error);
			// You could add a toast notification here instead of alert
			alert('Failed to delete category. Please try again.');
		}
	}

	// Handle category updated
	function handleCategoryUpdated() {
		editCategoryOpen = false;
		categoryToEdit = null;
		onCategoryUpdated?.();
	}
</script>

<div class="mt-4 space-y-2">
	<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Categories</h2>

	{#if error}
		<div class="mt-4 text-center text-xs text-red-500">Failed to load categories</div>
	{:else if loading}
		<div class="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
			Loading categories...
		</div>
	{:else if !categories || categories.length === 0}
		<div class="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">No categories yet</div>
	{:else}
		<RadioGroup.Root
			bind:value={selectedCategoryId}
			onValueChange={handleCategoryChange}
			class="flex flex-wrap justify-center gap-3"
		>
			{#each categories as category, index (category.id + '-' + index)}
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<Label
							class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-input/20"
							style="background-color: {category.color}20"
						>
							<RadioGroup.Item
								value={String(category.id)}
								id={String(category.id)}
								class="sr-only data-[state=checked]:border-primary"
							/>
							<div class="flex flex-col items-center gap-1 font-normal">
								<div class="text-lg leading-snug">
									{category.icon}
								</div>
								<div class="text-center font-medium">{category.name}</div>
							</div>
						</Label>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item onclick={() => handleModifyCategory(category)}>
							Modify
						</ContextMenu.Item>
						<ContextMenu.Item onclick={() => handleDeleteCategory(category)} class="text-red-600">
							Delete
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}
		</RadioGroup.Root>
	{/if}
</div>

<!-- Edit Category Drawer -->
<EditCategory
	bind:open={editCategoryOpen}
	category={categoryToEdit}
	onCategoryUpdated={handleCategoryUpdated}
	{userId}
/>

<!-- Delete Category Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Category</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{categoryToDelete?.name}"? This will also delete all
				associated activities and time sessions. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={confirmDeleteCategory}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
