<script lang="ts">
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
	import { DEFAULT_ACTIVITY_EMOJI } from '$lib/constants/emojis';
	import { toast } from 'svelte-sonner';

	import { createActivity, getCategoriesWithActivities } from '$lib/api/data.remote';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onActivityCreated?: () => void;
		userId: string;
	}

	let { open = $bindable(), onOpenChange, onActivityCreated, userId }: Props = $props();

	let activityForm = $state({
		name: '',
		icon: DEFAULT_ACTIVITY_EMOJI,
		categoryId: 0,
		dailyGoal: undefined as number | undefined,
		weeklyGoal: undefined as number | undefined,
		monthlyGoal: undefined as number | undefined
	});

	// Category selection using ToggleGroup
	let selectedCategoryIds = $state<string[]>([]);

	let isPending = $state(false);

	// Get categories for selection
	const categoriesQuery = $derived.by(() => getCategoriesWithActivities());

	async function handleCreateActivity() {
		if (!activityForm.name.trim() || selectedCategoryIds.length === 0 || isPending) return;

		isPending = true;
		try {
			const activityData = {
				userId,
				name: activityForm.name.trim(),
				icon: activityForm.icon,
				...(activityForm.dailyGoal && { dailyGoal: activityForm.dailyGoal }),
				...(activityForm.weeklyGoal && { weeklyGoal: activityForm.weeklyGoal }),
				...(activityForm.monthlyGoal && { monthlyGoal: activityForm.monthlyGoal }),
				categoryIds: selectedCategoryIds.map((id) => parseInt(id))
			};

			await createActivity(activityData);

			// Reset form
			resetForm();

			// Close drawer
			open = false;
			onOpenChange?.(false);

			// Notify parent component
			onActivityCreated?.();
		} catch (error) {
			console.error('Failed to create activity:', error);
			toast.error('Failed to create activity. Please try again.');
		} finally {
			isPending = false;
		}
	}

	function resetForm() {
		activityForm = {
			name: '',
			icon: DEFAULT_ACTIVITY_EMOJI,
			categoryId: 0,
			dailyGoal: undefined,
			weeklyGoal: undefined,
			monthlyGoal: undefined
		};
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
				<DrawerTitle>Create Activity</DrawerTitle>
				<DrawerDescription>Add a new activity to track your time</DrawerDescription>
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

				<div class="space-y-2">
					<Label>Icon</Label>
					<IconPicker value={activityForm.icon} onSelect={(emoji) => (activityForm.icon = emoji)} />
				</div>

				<div class="space-y-2">
					<Label>Goals (optional, in minutes)</Label>
					<p class="text-xs text-muted-foreground">Goals take effect tomorrow.</p>
					<div class="grid grid-cols-3 gap-2">
						<div class="space-y-1">
							<Label for="daily-goal" class="text-xs">Daily</Label>
							<Input
								id="daily-goal"
								type="number"
								bind:value={activityForm.dailyGoal}
								placeholder="60"
								class="text-sm"
								min="1"
							/>
						</div>
						<div class="space-y-1">
							<Label for="weekly-goal" class="text-xs">Weekly</Label>
							<Input
								id="weekly-goal"
								type="number"
								bind:value={activityForm.weeklyGoal}
								placeholder="420"
								class="text-sm"
								min="1"
							/>
						</div>
						<div class="space-y-1">
							<Label for="monthly-goal" class="text-xs">Monthly</Label>
							<Input
								id="monthly-goal"
								type="number"
								bind:value={activityForm.monthlyGoal}
								placeholder="1800"
								class="text-sm"
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
						onclick={handleCreateActivity}
						disabled={!activityForm.name.trim() || selectedCategoryIds.length === 0 || isPending}
						class="flex-1"
					>
						{isPending ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
