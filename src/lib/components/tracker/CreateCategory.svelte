<script lang="ts">
	import { createCategory } from '$lib/api/data.remote';
	import { IconPicker } from '$lib/components/icon-picker';
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
	import { DEFAULT_CATEGORY_EMOJI } from '$lib/constants/emojis';
	import type { InsertCategory } from '$lib/server/db/schema';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onCategoryCreated?: () => void;
		userId: string;
	}

	let { open = $bindable(), onOpenChange, onCategoryCreated, userId }: Props = $props();

	let categoryForm = $state({
		name: '',
		color: '#3B82F6',
		icon: DEFAULT_CATEGORY_EMOJI
	});

	let isPending = $state(false);

	// Available colors for category with semantic names
	const colors = [
		{ hex: '#3B82F6', name: 'blue' },
		{ hex: '#EF4444', name: 'red' },
		{ hex: '#10B981', name: 'green' },
		{ hex: '#F59E0B', name: 'yellow' },
		{ hex: '#8B5CF6', name: 'purple' },
		{ hex: '#F97316', name: 'orange' },
		{ hex: '#06B6D4', name: 'cyan' },
		{ hex: '#84CC16', name: 'lime' },
		{ hex: '#EC4899', name: 'pink' },
		{ hex: '#6B7280', name: 'gray' }
	];

	async function handleCreateCategory() {
		if (!categoryForm.name.trim() || isPending) return;

		isPending = true;
		try {
			const categoryData: InsertCategory = {
				name: categoryForm.name.trim(),
				color: categoryForm.color,
				icon: categoryForm.icon,
				userId
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
			toast.error('Failed to create category. Please try again.');
		} finally {
			isPending = false;
		}
	}

	function resetForm() {
		categoryForm = {
			name: '',
			color: '#3B82F6',
			icon: DEFAULT_CATEGORY_EMOJI
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
						{#each colors as color (color.hex)}
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 rounded-full border-2 p-0 transition-all {categoryForm.color ===
								color.hex
									? 'border-foreground'
									: 'border-muted'}"
								style="background-color: {color.hex}"
								onclick={() => (categoryForm.color = color.hex)}
								aria-label="Select {color.name} color"
							></Button>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<Label>Icon</Label>
					<IconPicker value={categoryForm.icon} onSelect={(emoji) => (categoryForm.icon = emoji)} />
				</div>
			</div>

			<DrawerFooter>
				<div class="flex gap-2">
					<DrawerClose class="flex-1">
						<Button variant="outline" class="w-full" disabled={isPending}>Cancel</Button>
					</DrawerClose>
					<Button
						onclick={handleCreateCategory}
						disabled={!categoryForm.name.trim() || isPending}
						class="flex-1"
					>
						{isPending ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
