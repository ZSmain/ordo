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
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import type { TrackerActivity } from '$lib/tracker/activity-projection';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		activity: TrackerActivity | null;
		onOpenChange?: (open: boolean) => void;
		onActivityUpdated?: () => void;
	}

	let { open = $bindable(), activity, onOpenChange, onActivityUpdated }: Props = $props();

	let activityForm = $state({
		name: '',
		icon: '📋',
		dailyGoal: undefined as number | undefined,
		weeklyGoal: undefined as number | undefined,
		monthlyGoal: undefined as number | undefined
	});

	// Category selection using ToggleGroup
	let selectedCategoryIds = $state<string[]>([]);

	let isPending = $state(false);

	// Get categories for selection
	const categoriesQuery = $derived.by(() => getCategoriesWithActivities());

	/** Prefer latest scheduled goals (includes pending tomorrow change) for editing. */
	function applyGoalsToForm(source: NonNullable<typeof activity>) {
		const goals = source.latestGoals ?? source;
		activityForm.dailyGoal = goals.dailyGoal || undefined;
		activityForm.weeklyGoal = goals.weeklyGoal || undefined;
		activityForm.monthlyGoal = goals.monthlyGoal || undefined;
	}

	// Initialize form when activity changes
	$effect(() => {
		if (activity) {
			activityForm.name = activity.name;
			activityForm.icon = activity.icon;
			applyGoalsToForm(activity);
			selectedCategoryIds = activity.categories?.map((cat) => cat.id.toString()) || [];
		} else {
			resetForm();
		}
	});

	async function handleUpdateActivity() {
		if (!activityForm.name.trim() || !activity || selectedCategoryIds.length === 0 || isPending)
			return;

		isPending = true;
		try {
			await updateActivity({
				id: activity.id,
				name: activityForm.name.trim(),
				icon: activityForm.icon,
				dailyGoal: activityForm.dailyGoal ?? null,
				weeklyGoal: activityForm.weeklyGoal ?? null,
				monthlyGoal: activityForm.monthlyGoal ?? null,
				categoryIds: selectedCategoryIds.map((id) => parseInt(id))
			});

			open = false;
			onOpenChange?.(false);
			onActivityUpdated?.();
		} catch (error) {
			console.error('Failed to update activity:', error);
			toast.error('Failed to update activity. Please try again.');
		} finally {
			isPending = false;
		}
	}

	function resetForm() {
		if (activity) {
			activityForm.name = activity.name;
			activityForm.icon = activity.icon;
			applyGoalsToForm(activity);
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
					{#if categoriesQuery.current?.length}
						<ToggleGroup
							type="multiple"
							bind:value={selectedCategoryIds}
							aria-label="Categories"
							class="flex w-full flex-row flex-wrap gap-2 rounded-none"
						>
							{#each categoriesQuery.current as category (category.id)}
								<ToggleGroupItem
									value={String(category.id)}
									aria-label={`Toggle ${category.name}`}
									class="h-auto rounded-full border-0 bg-secondary px-3 py-1.5 text-sm font-normal shadow-none transition-colors duration-150 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
								>
									<div class="flex items-center gap-1.5">
										<span class="text-sm">{category.icon}</span>
										<span class="text-nowrap">{category.name}</span>
									</div>
								</ToggleGroupItem>
							{/each}
						</ToggleGroup>
					{:else}
						<p class="text-xs text-muted-foreground">No categories yet</p>
					{/if}
				</div>

				<!-- Goals in a compact grid — changes take effect tomorrow -->
				<div class="space-y-2">
					<Label>Goals (minutes)</Label>
					<p class="text-xs text-muted-foreground">Changes take effect tomorrow.</p>
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
						<Button variant="outline" class="w-full" disabled={isPending}>Cancel</Button>
					</DrawerClose>
					<Button
						onclick={handleUpdateActivity}
						disabled={!activityForm.name.trim() || selectedCategoryIds.length === 0 || isPending}
						class="flex-1"
					>
						{isPending ? 'Updating...' : 'Update'}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
