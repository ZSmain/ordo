<script lang="ts">
	import { deleteCategory } from '$lib/api/data.remote';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import type { Category } from '$lib/types';
	import { PencilLine, Trash2, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import EditCategory from './EditCategory.svelte';

	interface Props {
		categories: Category[];
		selectedCategoryIds: string[];
		filterMode?: 'AND' | 'OR';
		onFilterModeChange?: (mode: 'AND' | 'OR') => void;
		onClearSelection?: () => void;
		loading?: boolean;
		error?: Error | null;
		onSelectedCategoryIdsChange?: (categoryIds: string[]) => void;
		userId?: string;
	}

	let {
		categories,
		selectedCategoryIds = $bindable([]),
		filterMode = 'OR',
		onFilterModeChange,
		onClearSelection,
		loading = false,
		error = null,
		onSelectedCategoryIdsChange,
		userId = ''
	}: Props = $props();

	let editCategoryOpen = $state(false);
	let categoryToEdit = $state<Category | null>(null);
	let deleteDialogOpen = $state(false);
	let categoryToDelete = $state<Category | null>(null);
	let isDeleting = $state(false);

	function handleSelectedCategoryIdsChange(categoryIds: string[]) {
		onSelectedCategoryIdsChange?.(categoryIds);
	}

	function handleClearSelection() {
		onClearSelection?.();
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
		if (!userId || !categoryToDelete || isDeleting) return;

		isDeleting = true;
		const categoryName = categoryToDelete.name;

		try {
			await deleteCategory({ id: categoryToDelete.id });

			toast.success(`"${categoryName}" deleted`);
			deleteDialogOpen = false;
			categoryToDelete = null;
		} catch (error) {
			console.error('Failed to delete category:', error);
			toast.error('Failed to delete category. Please try again.');
		} finally {
			isDeleting = false;
		}
	}

	// Handle category updated
	function handleCategoryUpdated() {
		editCategoryOpen = false;
		categoryToEdit = null;
	}
</script>

<div class="mt-4 space-y-2 px-1">
	{#if error}
		<div class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
			<p class="text-sm font-medium text-foreground">Failed to load categories</p>
			<p class="mt-1 text-xs text-muted-foreground">Please try refreshing the page</p>
		</div>
	{:else if loading}
		<!-- Skeleton loading state -->
		<Card class="py-4 shadow-none">
			<CardContent class="px-4">
				<div class="space-y-4">
					<Skeleton class="h-5 w-24" />
					<div class="flex flex-wrap gap-2">
						{#each Array.from({ length: 4 }, (_, index) => index) as index (index)}
							<Skeleton class="h-8 w-20 rounded-full" />
						{/each}
					</div>
				</div>
			</CardContent>
		</Card>
	{:else if !categories || categories.length === 0}
		<div class="mt-4 text-center text-xs text-muted-foreground">No categories yet</div>
	{:else}
		<Card class="py-4 shadow-none">
			<CardContent class="px-4">
				<form>
					<Field.Group>
						<Field.Set class="gap-4">
							<div class="flex items-center justify-between gap-3">
								<Field.Legend>Categories</Field.Legend>
								{#if selectedCategoryIds.length > 0}
									<div class="flex flex-wrap items-center justify-end gap-2">
										{#if selectedCategoryIds.length > 1}
											<div class="flex items-center gap-2">
												<Label for="filter-mode" class="text-xs text-muted-foreground"
													>Match all</Label
												>
												<Switch
													id="filter-mode"
													checked={filterMode === 'AND'}
													onCheckedChange={(checked) =>
														onFilterModeChange?.(checked ? 'AND' : 'OR')}
												/>
											</div>
										{/if}
										<Button
											variant="ghost"
											size="sm"
											class="h-7 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground"
											onclick={handleClearSelection}
											aria-label="Clear selected categories"
										>
											<X class="size-3.5" />
											Clear
										</Button>
									</div>
								{/if}
							</div>
							<ToggleGroup
								type="multiple"
								value={selectedCategoryIds}
								onValueChange={handleSelectedCategoryIdsChange}
								aria-label="Categories"
								class="flex w-full flex-row flex-wrap gap-2 rounded-none"
							>
								{#each categories as category, index (category.id + '-' + index)}
									<ContextMenu.Root>
										<ContextMenu.Trigger>
											<ToggleGroupItem
												value={String(category.id)}
												class="h-auto rounded-full border-0 px-3 py-1.5 text-sm font-normal shadow-none transition-all duration-100 ease-linear"
												style="background-color: {isSelected(category.id)
													? category.color + '40'
													: category.color + '10'}"
											>
												<div class="flex items-center gap-1.5">
													<span class="text-sm">{category.icon}</span>
													<span class="text-nowrap">{category.name}</span>
												</div>
											</ToggleGroupItem>
										</ContextMenu.Trigger>
										<ContextMenu.Content>
											<ContextMenu.Item onclick={() => handleModifyCategory(category)}>
												<PencilLine class="mr-2 h-4 w-4" />
												Modify
											</ContextMenu.Item>
											<ContextMenu.Separator />
											<ContextMenu.Item
												onclick={() => handleDeleteCategory(category)}
												class="text-destructive focus:text-destructive"
											>
												<Trash2 class="mr-2 h-4 w-4" />
												Delete
											</ContextMenu.Item>
										</ContextMenu.Content>
									</ContextMenu.Root>
								{/each}
							</ToggleGroup>
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
/>

<!-- Delete Category Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title>Delete Category</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{categoryToDelete?.name}"? This will also delete all
				associated activities and time sessions. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)} disabled={isDeleting}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={confirmDeleteCategory} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
