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
	import * as Select from '$lib/components/ui/select';
	import type { ActivityWithOptionalCategories, Category } from '$lib/types';
	import { updateActivity, getCategoriesWithActivities } from '../../../routes/(app)/data.remote';

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
	const categoriesQuery = getCategoriesWithActivities(userId);

	// Convert categories to Select format
	let selectCategories = $derived.by(() => {
		if (!categoriesQuery.current) return [];
		return categoriesQuery.current.map((category) => ({
			value: category.id.toString(),
			label: `${category.icon} ${category.name}`
		}));
	});

	// Available icons for activity
	const icons = ['📋', '💻', '📚', '🏃‍♂️', '🎨', '🎵', '🍽️', '🛠️', '💼', '🎯'];

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
				<div class="space-y-2">
					<Label for="activity-name">Activity Name</Label>
					<Input
						id="activity-name"
						bind:value={activityForm.name}
						placeholder="Enter activity name"
						class="w-full"
					/>
				</div>

				<div class="space-y-2">
					<Label>Icon</Label>
					<div class="flex flex-wrap gap-2">
						{#each icons as icon (icon)}
							<Button
								variant="ghost"
								size="icon"
								class="h-10 w-10 rounded-lg border-2 text-lg transition-all hover:bg-gray-50 {activityForm.icon ===
								icon
									? 'border-gray-900'
									: 'border-gray-300'}"
								onclick={() => (activityForm.icon = icon)}
								aria-label="Select icon {icon}"
							>
								{icon}
							</Button>
						{/each}
					</div>
				</div>

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

				<div class="space-y-2">
					<Label for="daily-goal">Daily Goal (minutes)</Label>
					<Input
						id="daily-goal"
						type="number"
						bind:value={activityForm.dailyGoal}
						placeholder="Enter daily goal in minutes"
						class="w-full"
						min="1"
					/>
				</div>

				<div class="space-y-2">
					<Label for="weekly-goal">Weekly Goal (minutes)</Label>
					<Input
						id="weekly-goal"
						type="number"
						bind:value={activityForm.weeklyGoal}
						placeholder="Enter weekly goal in minutes"
						class="w-full"
						min="1"
					/>
				</div>

				<div class="space-y-2">
					<Label for="monthly-goal">Monthly Goal (minutes)</Label>
					<Input
						id="monthly-goal"
						type="number"
						bind:value={activityForm.monthlyGoal}
						placeholder="Enter monthly goal in minutes"
						class="w-full"
						min="1"
					/>
				</div>
			</div>

			<DrawerFooter>
				<div class="flex gap-2">
					<DrawerClose>
						<Button variant="outline" class="flex-1">Cancel</Button>
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
