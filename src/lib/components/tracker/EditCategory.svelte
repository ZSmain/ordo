<script lang="ts">
	import { updateCategory } from '$lib/api/data.remote';
	import { Button } from '$lib/components/ui/button';
	import {
		Drawer,
		DrawerClose,
		DrawerContent,
		DrawerDescription,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle
	} from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Category } from '$lib/types';

	interface Props {
		open: boolean;
		category: Category | null;
		onOpenChange?: (open: boolean) => void;
		onCategoryUpdated?: () => void;
		userId: string;
	}

	let { open = $bindable(), category, onOpenChange, onCategoryUpdated, userId }: Props = $props();

	let categoryForm = $state({
		name: '',
		color: '#3B82F6',
		icon: '📁'
	});

	// Available colors for category
	const colors = [
		'#3B82F6', // blue
		'#EF4444', // red
		'#10B981', // green
		'#F59E0B', // yellow
		'#8B5CF6', // purple
		'#F97316', // orange
		'#06B6D4', // cyan
		'#84CC16', // lime
		'#EC4899', // pink
		'#6B7280' // gray
	];

	// Available icons for category
	const icons = ['📁', '💼', '🎯', '📚', '🏃‍♂️', '🎨', '💻', '🍽️', '🛠️', '🎵'];

	// Initialize form when category changes
	$effect(() => {
		if (category) {
			categoryForm.name = category.name;
			categoryForm.color = category.color;
			categoryForm.icon = category.icon;
		}
	});

	async function handleUpdateCategory() {
		if (!categoryForm.name.trim() || !category) return;

		try {
			await updateCategory({
				id: category.id,
				name: categoryForm.name.trim(),
				color: categoryForm.color,
				icon: categoryForm.icon,
				userId
			});

			// Close drawer
			open = false;
			onOpenChange?.(false);

			// Notify parent component
			onCategoryUpdated?.();
		} catch (error) {
			console.error('Failed to update category:', error);
		}
	}

	function resetForm() {
		if (category) {
			categoryForm.name = category.name;
			categoryForm.color = category.color;
			categoryForm.icon = category.icon;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}
</script>

<Drawer {open} onOpenChange={handleOpenChange}>
	<DrawerContent>
		<div class="mx-auto w-full max-w-sm">
			<DrawerHeader>
				<DrawerTitle>Edit Category</DrawerTitle>
				<DrawerDescription>Update the category details</DrawerDescription>
			</DrawerHeader>

			<div class="space-y-4 p-4 pb-0">
				<div class="space-y-2">
					<Label for="category-name">Category Name</Label>
					<Input
						id="category-name"
						bind:value={categoryForm.name}
						placeholder="Enter category name"
						class="w-full"
					/>
				</div>

				<div class="space-y-2">
					<Label>Color</Label>
					<div class="flex flex-wrap gap-2">
						{#each colors as color}
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 rounded-full border-2 p-0 transition-all {categoryForm.color ===
								color
									? 'border-gray-900'
									: 'border-gray-300'}"
								style="background-color: {color}"
								onclick={() => (categoryForm.color = color)}
								aria-label="Select color {color}"
							></Button>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<Label>Icon</Label>
					<div class="flex flex-wrap gap-2">
						{#each icons as icon}
							<Button
								variant="ghost"
								size="icon"
								class="h-10 w-10 rounded-lg border-2 text-lg transition-all hover:bg-gray-50 {categoryForm.icon ===
								icon
									? 'border-gray-900'
									: 'border-gray-300'}"
								onclick={() => (categoryForm.icon = icon)}
								aria-label="Select icon {icon}"
							>
								{icon}
							</Button>
						{/each}
					</div>
				</div>
			</div>

			<DrawerFooter>
				<div class="flex gap-2">
					<DrawerClose>
						<Button variant="outline" class="flex-1">Cancel</Button>
					</DrawerClose>
					<Button
						onclick={handleUpdateCategory}
						disabled={!categoryForm.name.trim()}
						class="flex-1"
					>
						Update
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
