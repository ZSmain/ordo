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
	import type { InsertActivity } from '$lib/server/db/schema';
	import { createActivity, getCategoriesWithActivities } from '../../../routes/(app)/data.remote';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onActivityCreated?: () => void;
		userId: string;
	}

	let { open = $bindable(), onOpenChange, onActivityCreated, userId }: Props = $props();

	let activityForm = $state({
		name: '',
		icon: '⚡',
		categoryId: 0,
		dailyGoal: undefined as number | undefined,
		weeklyGoal: undefined as number | undefined,
		monthlyGoal: undefined as number | undefined
	});

	// Get categories for selection
	const categoriesQuery = getCategoriesWithActivities(userId);

	// Available icons for activity
	const icons = ['⚡', '🏃‍♂️', '📚', '💻', '🎨', '🍽️', '🛠️', '🎵', '🧘‍♀️', '💼'];

	async function handleCreateActivity() {
		if (!activityForm.name.trim() || !activityForm.categoryId) return;

		try {
			const activityData: InsertActivity = {
				name: activityForm.name.trim(),
				icon: activityForm.icon,
				categoryId: activityForm.categoryId,
				userId,
				...(activityForm.dailyGoal && { dailyGoal: activityForm.dailyGoal }),
				...(activityForm.weeklyGoal && { weeklyGoal: activityForm.weeklyGoal }),
				...(activityForm.monthlyGoal && { monthlyGoal: activityForm.monthlyGoal })
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
		}
	}

	function resetForm() {
		activityForm = {
			name: '',
			icon: '⚡',
			categoryId: 0,
			dailyGoal: undefined,
			weeklyGoal: undefined,
			monthlyGoal: undefined
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
					<Label for="activity-category">Category</Label>
					<select
						id="activity-category"
						bind:value={activityForm.categoryId}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					>
						<option value={0}>Select a category</option>
						{#if categoriesQuery.current}
							{#each categoriesQuery.current as category}
								<option value={category.id}>
									{category.icon}
									{category.name}
								</option>
							{/each}
						{/if}
					</select>
				</div>

				<div class="space-y-2">
					<Label>Icon</Label>
					<div class="flex flex-wrap gap-2">
						{#each icons as icon}
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
					<Label>Goals (optional, in minutes)</Label>
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
					<DrawerClose>
						<Button variant="outline" class="flex-1">Cancel</Button>
					</DrawerClose>
					<Button
						onclick={handleCreateActivity}
						disabled={!activityForm.name.trim() || !activityForm.categoryId}
						class="flex-1"
					>
						Create
					</Button>
				</div>
			</DrawerFooter>
		</div>
	</DrawerContent>
</Drawer>
