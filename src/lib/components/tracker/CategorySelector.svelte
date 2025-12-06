<script lang="ts">
	import { deleteCategory } from '$lib/api/data.remote';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import type { Category } from '$lib/types';
	import { PencilLine, Trash2 } from '@lucide/svelte';
	import EditCategory from './EditCategory.svelte';

	interface Props {
		categories: Category[];
		selectedCategoryIds: string[];
		filterMode?: 'AND' | 'OR';
		onFilterModeChange?: (mode: 'AND' | 'OR') => void;
		loading?: boolean;
		error?: Error | null;
		onCategoryChange?: (categoryId: string) => void;
		userId?: string;
	}

	let {
		categories,
		selectedCategoryIds = $bindable([]),
		filterMode = 'OR',
		onFilterModeChange,
		loading = false,
		error = null,
		onCategoryChange,
		userId = ''
	}: Props = $props();

	let editCategoryOpen = $state(false);
	let categoryToEdit = $state<Category | null>(null);
	let deleteDialogOpen = $state(false);
	let categoryToDelete = $state<Category | null>(null);

	// Handle category selection
	function handleCategoryChange(value: string) {
		onCategoryChange?.(value);
	}

	// Check if a category is selected
	function isSelected(categoryId: number): boolean {
		return selectedCategoryIds.includes(String(categoryId));
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
	}
</script>

<div class="mt-4 space-y-2">
	{#if error}
		<div class="mt-4 text-center text-xs text-red-500">Failed to load categories</div>
	{:else if loading}
		<div class="mt-4 text-center text-xs text-muted-foreground">Loading categories...</div>
	{:else if !categories || categories.length === 0}
		<div class="mt-4 text-center text-xs text-muted-foreground">No categories yet</div>
	{:else}
		<Card class="py-4 shadow-none">
			<CardContent class="px-4">
				<form>
					<Field.Group>
						<Field.Set class="gap-4">
							<div class="flex items-center justify-between">
								<Field.Legend>Categories</Field.Legend>
								{#if selectedCategoryIds.length > 1}
									<div class="flex items-center gap-2">
										<Label for="filter-mode" class="text-xs text-muted-foreground">
											Match all
										</Label>
										<Switch
											id="filter-mode"
											checked={filterMode === 'AND'}
											onCheckedChange={(checked) =>
												onFilterModeChange?.(checked ? 'AND' : 'OR')}
										/>
									</div>
								{/if}
							</div>
							<Field.Group class="flex flex-row flex-wrap gap-2 [--radius:9999rem]">
								{#each categories as category, index (category.id + '-' + index)}
									<ContextMenu.Root>
										<ContextMenu.Trigger>
											<Field.Label for={String(category.id)} class="w-fit! cursor-pointer">
												<Field.Field
													orientation="horizontal"
													class="group-has-data-[state=checked]/field-label:px-2! gap-1.5 overflow-hidden rounded-full px-3! py-1.5! transition-all duration-100 ease-linear"
													style="background-color: {isSelected(category.id)
														? category.color + '40'
														: category.color + '10'}"
												>
													<Checkbox
														value={String(category.id)}
														id={String(category.id)}
														checked={isSelected(category.id)}
														onCheckedChange={() => handleCategoryChange(String(category.id))}
														class="-ms-6 -translate-x-1 rounded-full transition-all duration-100 ease-linear data-[state=checked]:ms-0 data-[state=checked]:translate-x-0"
													/>
													<div class="flex items-center gap-1.5">
														<span class="text-sm">{category.icon}</span>
														<Field.Title class="text-nowrap">{category.name}</Field.Title>
													</div>
												</Field.Field>
											</Field.Label>
										</ContextMenu.Trigger>
										<ContextMenu.Content>
											<ContextMenu.Item onclick={() => handleModifyCategory(category)}>
												<PencilLine class="mr-2 h-4 w-4" />
												Modify
											</ContextMenu.Item>
											<ContextMenu.Separator />
											<ContextMenu.Item
												onclick={() => handleDeleteCategory(category)}
												class="text-red-600 focus:text-red-600"
											>
												<Trash2 class="mr-2 h-4 w-4" />
												Delete
											</ContextMenu.Item>
										</ContextMenu.Content>
									</ContextMenu.Root>
								{/each}
							</Field.Group>
						</Field.Set>
					</Field.Group>
				</form>
			</CardContent>
		</Card>
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
