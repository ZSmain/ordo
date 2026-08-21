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
		/** When true, category pills collapse so favorites can use the vertical space. */
		showFavorites?: boolean;
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
		userId = '',
		showFavorites = false
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

	function handleModifyCategory(category: Category) {
		categoryToEdit = category;
		editCategoryOpen = true;
	}

	function handleDeleteCategory(category: Category) {
		categoryToDelete = category;
		deleteDialogOpen = true;
	}

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

	function handleCategoryUpdated() {
		editCategoryOpen = false;
		categoryToEdit = null;
	}

	const hasCategories = $derived((categories?.length ?? 0) > 0);
	const showFilterControls = $derived(
		!showFavorites && selectedCategoryIds.length > 0 && hasCategories
	);
</script>

<div class="space-y-2 px-1">
	{#if error}
		<div class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
			<p class="text-sm font-medium text-foreground">Failed to load categories</p>
			<p class="mt-1 text-xs text-muted-foreground">Please try refreshing the page</p>
		</div>
	{:else if loading}
		<Card class="category-panel py-4 pt-7 pr-7 shadow-none">
			<CardContent class="px-4 pr-7">
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
	{:else if !hasCategories && !showFavorites}
		<div class="mt-4 text-center text-xs text-muted-foreground">No categories yet</div>
	{:else}
		<Card
			class="category-panel py-4 pr-7 shadow-none transition-[padding] duration-300 ease-out {showFavorites
				? 'pt-6'
				: 'pt-7'}"
			data-collapsed={showFavorites ? 'true' : 'false'}
		>
			<CardContent class="px-4 pr-7">
				<form>
					<Field.Group>
						<Field.Set class="gap-0">
							<div
								class="flex items-center justify-between gap-3 transition-[margin] duration-300 ease-out {showFavorites
									? 'mb-0'
									: 'mb-4'}"
							>
								<Field.Legend class="mb-0">
									{showFavorites ? 'Favorites' : 'Categories'}
								</Field.Legend>
								{#if showFilterControls}
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

							<!-- Collapsible category pills: grid 1fr → 0fr keeps height animation smooth -->
							<div
								id="categories-grid"
								class="categories-collapse"
								class:collapsed={showFavorites}
								aria-hidden={showFavorites}
								inert={showFavorites}
							>
								<div class="categories-collapse-inner">
									{#if hasCategories}
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
															class="h-auto rounded-full border-0 bg-secondary px-3 py-1.5 text-sm font-normal shadow-none transition-colors duration-150 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
														>
															<div class="flex items-center gap-1.5">
																<span class="text-sm">{category.icon}</span>
																<span class="text-nowrap">{category.name}</span>
															</div>
														</ToggleGroupItem>
													</ContextMenu.Trigger>
													<ContextMenu.Content>
														<ContextMenu.Item onSelect={() => handleModifyCategory(category)}>
															<PencilLine />
															Modify
														</ContextMenu.Item>
														<ContextMenu.Separator />
														<ContextMenu.Item
															onSelect={() => handleDeleteCategory(category)}
															class="text-destructive focus:text-destructive"
														>
															<Trash2 />
															Delete
														</ContextMenu.Item>
													</ContextMenu.Content>
												</ContextMenu.Root>
											{/each}
										</ToggleGroup>
									{:else}
										<p class="text-xs text-muted-foreground">No categories yet</p>
									{/if}
								</div>
							</div>
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
	<Dialog.Content class="sm:max-w-md">
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

<style>
	/* Animate height via grid-template-rows (stable cross-browser alternative to max-height hacks) */
	.categories-collapse {
		display: grid;
		grid-template-rows: 1fr;
		opacity: 1;
		transition:
			grid-template-rows 0.4s ease,
			opacity 0.3s ease,
			margin-top 0.3s ease;
	}

	.categories-collapse.collapsed {
		grid-template-rows: 0fr;
		opacity: 0;
		margin-top: 0;
		pointer-events: none;
	}

	.categories-collapse-inner {
		overflow: hidden;
		min-height: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.categories-collapse {
			transition: none;
		}
	}
</style>
