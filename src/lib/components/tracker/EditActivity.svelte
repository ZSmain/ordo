<script lang="ts">
	import { getCategoriesWithActivities, updateActivity } from '$lib/api/data.remote';
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
	import * as Select from '$lib/components/ui/select';
	import type { ActivityWithOptionalCategories, Category } from '$lib/types';

	interface Props {
		open: boolean;
		activity: ActivityWithOptionalCategories | null;
		onOpenChange?: (open: boolean) => void;
		onActivityUpdated?: () => void;
		userId: string;
	}

	let { open = $bindable(), activity, onOpenChange, onActivityUpdated, userId }: Props = $props();

	let activityForm = $state({
		name: '',
		icon: '📋',
		dailyGoal: undefined as number | undefined,
		weeklyGoal: undefined as number | undefined,
		monthlyGoal: undefined as number | undefined
	});

	// Category selection using Select component
	let selectedCategoryIds = $state<string[]>([]);

	// Get categories for selection
	const categoriesQuery = $derived.by(() => getCategoriesWithActivities(userId));

	// Convert categories to Select format
	let selectCategories = $derived.by(() => {
		if (!categoriesQuery.current) return [];
		return categoriesQuery.current.map((category) => ({
			value: category.id.toString(),
			label: `${category.icon} ${category.name}`
		}));
	});

	// Initialize form when activity changes
	$effect(() => {
		if (activity) {
			activityForm.name = activity.name;
			activityForm.icon = activity.icon;
			activityForm.dailyGoal = activity.dailyGoal || undefined;
			activityForm.weeklyGoal = activity.weeklyGoal || undefined;
			activityForm.monthlyGoal = activity.monthlyGoal || undefined;

			// Initialize selected categories from the activity's categories
			selectedCategoryIds = activity.categories?.map((cat: Category) => cat.id.toString()) || [];
		} else {
			// Reset form when activity is null
			resetForm();
		}
	});

	async function handleUpdateActivity() {
		if (!activityForm.name.trim() || !activity || selectedCategoryIds.length === 0) return;

		try {
			await updateActivity({
				id: activity.id,
				name: activityForm.name.trim(),
				icon: activityForm.icon,
				dailyGoal: activityForm.dailyGoal,
				weeklyGoal: activityForm.weeklyGoal,
				monthlyGoal: activityForm.monthlyGoal,
				userId,
				categoryIds: selectedCategoryIds.map((id) => parseInt(id))
			});

			// Close drawer
			open = false;
			onOpenChange?.(false);

			// Notify parent component
			onActivityUpdated?.();
		} catch (error) {
			console.error('Failed to update activity:', error);
		}
	}

	function resetForm() {
		if (activity) {
			activityForm.name = activity.name;
			activityForm.icon = activity.icon;
			activityForm.dailyGoal = activity.dailyGoal || undefined;
			activityForm.weeklyGoal = activity.weeklyGoal || undefined;
			activityForm.monthlyGoal = activity.monthlyGoal || undefined;
		}
		selectedCategoryIds = [];
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
				<DrawerTitle>Edit Activity</DrawerTitle>
				<DrawerDescription>Update the activity details</DrawerDescription>
			</DrawerHeader>

			<div class="space-y-4 p-4 pb-0">
				<!-- Name and Icon in one row -->
				<div class="space-y-2">
					<Label for="activity-name">Name & Icon</Label>
					<div class="flex items-center gap-2">
						<Input
							id="activity-name"
							bind:value={activityForm.name}
							placeholder="Activity name"
							class="flex-1"
						/>
						<IconPicker
							value={activityForm.icon}
							onSelect={(emoji) => (activityForm.icon = emoji)}
						/>
					</div>
				</div>

				<!-- Categories -->
				<div class="space-y-2">
					<Label for="activity-category">Categories</Label>
					<Select.Root type="multiple" bind:value={selectedCategoryIds}>
						<Select.Trigger class="w-full">
							{#if selectedCategoryIds.length === 0}
								<span class="text-muted-foreground">Select categories</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each selectedCategoryIds as categoryId (categoryId)}
										{#if categoriesQuery.current}
											{@const category = categoriesQuery.current.find(
												(c) => c.id.toString() === categoryId
											)}
											{#if category}
												<span
													class="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs"
												>
													{category.icon}
													{category.name}
												</span>
											{/if}
										{/if}
									{/each}
								</div>
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each selectCategories as category (category.value)}
								<Select.Item value={category.value} label={category.label}>
									{category.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Goals in a compact grid -->
				<div class="space-y-2">
					<Label>Goals (minutes)</Label>
					<div class="grid grid-cols-3 gap-2">
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">Daily</span>
							<Input
								id="daily-goal"
								type="number"
								bind:value={activityForm.dailyGoal}
								placeholder="0"
								min="1"
							/>
						</div>
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">Weekly</span>
							<Input
								id="weekly-goal"
								type="number"
								bind:value={activityForm.weeklyGoal}
								placeholder="0"
								min="1"
							/>
						</div>
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">Monthly</span>
							<Input
								id="monthly-goal"
								type="number"
								bind:value={activityForm.monthlyGoal}
								placeholder="0"
								min="1"
							/>
						</div>
					</div>
				</div>
			</div>

			<DrawerFooter>
				<div class="flex gap-2">
					<DrawerClose class="flex-1">
						<Button variant="outline" class="w-full">Cancel</Button>
					</DrawerClose>
					<Button
						onclick={handleUpdateActivity}
						disabled={!activityForm.name.trim() || selectedCategoryIds.length === 0}
						class="flex-1"
					>
						Update
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
