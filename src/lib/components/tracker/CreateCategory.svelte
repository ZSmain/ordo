<script lang="ts">
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
	import type { InsertCategory } from '$lib/server/db/schema';
	import { createCategory } from '../../../routes/data.remote';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onCategoryCreated?: () => void;
	}

	let { open = $bindable(), onOpenChange, onCategoryCreated }: Props = $props();

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

	async function handleCreateCategory() {
		if (!categoryForm.name.trim()) return;

		try {
			const categoryData: InsertCategory = {
				name: categoryForm.name.trim(),
				color: categoryForm.color,
				icon: categoryForm.icon
			};

			await createCategory(categoryData);

			// Reset form
			resetForm();

			// Close drawer
			open = false;
			onOpenChange?.(false);

			// Notify parent component
			onCategoryCreated?.();
		} catch (error) {
			console.error('Failed to create category:', error);
		}
	}

	function resetForm() {
		categoryForm = {
			name: '',
			color: '#3B82F6',
			icon: '📁'
		};
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
				<DrawerTitle>Create Category</DrawerTitle>
				<DrawerDescription>Add a new category to organize your activities</DrawerDescription>
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
						onclick={handleCreateCategory}
						disabled={!categoryForm.name.trim()}
						class="flex-1"
					>
						Create
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
