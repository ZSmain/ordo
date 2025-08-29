<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import type { Category } from '$lib/types';

	interface Props {
		categories: Category[];
		selectedCategoryId: string;
		loading?: boolean;
		error?: Error | null;
		onCategoryChange?: (categoryId: string) => void;
	}

	let {
		categories,
		selectedCategoryId = $bindable(),
		loading = false,
		error = null,
		onCategoryChange
	}: Props = $props();

	// Handle category selection
	function handleCategoryChange(value: string) {
		selectedCategoryId = value;
		onCategoryChange?.(value);
	}
</script>

<div class="mt-4 space-y-2">
	<h2 class="text-lg font-semibold text-gray-800">Categories</h2>

	{#if error}
		<div class="mt-4 text-center text-xs text-red-500">Failed to load categories</div>
	{:else if loading}
		<div class="mt-4 text-center text-xs text-slate-400">Loading categories...</div>
	{:else if !categories || categories.length === 0}
		<div class="mt-4 text-center text-xs text-slate-400">No categories yet</div>
	{:else}
		<RadioGroup.Root
			bind:value={selectedCategoryId}
			onValueChange={handleCategoryChange}
			class="flex flex-wrap justify-center gap-3"
		>
			{#each categories as category (category.id)}
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
			{/each}
		</RadioGroup.Root>
	{/if}
</div>
