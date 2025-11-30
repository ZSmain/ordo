<script lang="ts">
	import { createManualSession, getActivitiesForUser } from '$lib/api/daily.remote';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { ChevronDown, Clock, Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	interface Activity {
		id: number;
		name: string;
		icon: string;
		categories: Array<{
			id: number;
			name: string;
			color: string;
			icon: string;
		}>;
	}

	interface Props {
		open: boolean;
		userId: string;
		selectedDate: CalendarDate;
		onOpenChange: (open: boolean) => void;
		onSessionCreated: () => void;
	}

	let {
		open = $bindable(),
		userId,
		selectedDate,
		onOpenChange,
		onSessionCreated
	}: Props = $props();

	// Form state
	let selectedActivityId = $state<string>('');
	let startDateValue = $state<CalendarDate | undefined>();
	let startTime = $state('09:00');
	let endDateValue = $state<CalendarDate | undefined>();
	let endTime = $state('10:00');
	let notes = $state('');
	let startPopoverOpen = $state(false);
	let endPopoverOpen = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Fetch activities
	const activitiesQuery = $derived.by(() => {
		if (!open || !userId) return null;
		return getActivitiesForUser({ userId });
	});

	// Initialize form when drawer opens
	$effect(() => {
		if (open) {
			// Set default dates to the selected date
			startDateValue = selectedDate;
			endDateValue = selectedDate;
			// Reset form
			selectedActivityId = '';
			startTime = '09:00';
			endTime = '10:00';
			notes = '';
			error = null;
		}
	});

	function calendarDateToJSDate(calendarDate: CalendarDate, timeStr: string): Date {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return new Date(
			calendarDate.year,
			calendarDate.month - 1,
			calendarDate.day,
			hours,
			minutes,
			0,
			0
		);
	}

	function adjustTime(field: 'start' | 'end', minutes: number) {
		const currentDateValue = field === 'start' ? startDateValue : endDateValue;
		const currentTimeStr = field === 'start' ? startTime : endTime;

		if (!currentDateValue) return;

		const currentDateTime = calendarDateToJSDate(currentDateValue, currentTimeStr);
		currentDateTime.setMinutes(currentDateTime.getMinutes() + minutes);

		const newCalendarDate = new CalendarDate(
			currentDateTime.getFullYear(),
			currentDateTime.getMonth() + 1,
			currentDateTime.getDate()
		);
		const newTimeStr = currentDateTime.toTimeString().slice(0, 5);

		if (field === 'start') {
			startDateValue = newCalendarDate;
			startTime = newTimeStr;
		} else {
			endDateValue = newCalendarDate;
			endTime = newTimeStr;
		}
	}

	async function handleSave() {
		if (!selectedActivityId) {
			error = 'Please select an activity';
			return;
		}

		if (!startDateValue || !endDateValue) {
			error = 'Please select both start and end dates';
			return;
		}

		try {
			loading = true;
			error = null;

			const startDateTime = calendarDateToJSDate(startDateValue, startTime);
			const endDateTime = calendarDateToJSDate(endDateValue, endTime);

			if (endDateTime <= startDateTime) {
				error = 'End time must be after start time';
				return;
			}

			if (startDateTime > new Date()) {
				error = 'Start time cannot be in the future';
				return;
			}

			await createManualSession({
				activityId: parseInt(selectedActivityId),
				userId,
				startedAt: startDateTime.toISOString(),
				stoppedAt: endDateTime.toISOString(),
				notes: notes.trim() || undefined
			});

			toast.success('Session added successfully');
			onSessionCreated();
			onOpenChange(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create session';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		onOpenChange(false);
	}

	// Calculate duration in real-time
	let currentDuration = $derived.by(() => {
		if (!startDateValue || !endDateValue || !startTime || !endTime) {
			return null;
		}

		try {
			const startDateTime = calendarDateToJSDate(startDateValue, startTime);
			const endDateTime = calendarDateToJSDate(endDateValue, endTime);

			if (endDateTime <= startDateTime) {
				return null;
			}

			return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
		} catch {
			return null;
		}
	});

	function formatDuration(seconds: number | null): string {
		if (!seconds || seconds <= 0) return '0m';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		if (hours > 0) {
			if (minutes === 0 && remainingSeconds === 0) return `${hours}h`;
			if (remainingSeconds === 0) return `${hours}h ${minutes}m`;
			return `${hours}h ${minutes}m ${remainingSeconds}s`;
		}

		if (minutes > 0) {
			if (remainingSeconds === 0) return `${minutes}m`;
			return `${minutes}m ${remainingSeconds}s`;
		}

		return `${remainingSeconds}s`;
	}

	function getDurationColor(duration: number | null): string {
		if (!duration || duration <= 0) return 'text-muted-foreground';
		if (duration < 300) return 'text-orange-600 dark:text-orange-400';
		if (duration < 3600) return 'text-blue-600 dark:text-blue-400';
		return 'text-green-600 dark:text-green-400';
	}

	// Get the selected activity for display
	let selectedActivity = $derived.by(() => {
		if (!selectedActivityId || !activitiesQuery?.current) return null;
		return (activitiesQuery.current as Activity[]).find(
			(a) => a.id === parseInt(selectedActivityId)
		);
	});
</script>

<Drawer.Root {open} {onOpenChange}>
	<Drawer.Content class="max-h-[90vh]">
		<div class="mx-auto flex h-full w-full max-w-md flex-col">
			<Drawer.Header>
				<Drawer.Title class="text-center">
					<div class="mb-2 flex items-center justify-center gap-2">
						<Plus class="h-5 w-5" />
						<span class="font-semibold">Add Manual Session</span>
					</div>
					<div class="text-sm font-normal text-muted-foreground">Log a past activity</div>
				</Drawer.Title>
			</Drawer.Header>

			<!-- Duration Display -->
			<div class="px-4 pb-4">
				<div class="rounded-lg bg-muted/50 p-4 text-center">
					<div class="mb-1 flex items-center justify-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm font-medium">Duration</span>
					</div>
					<div class="text-2xl font-bold {getDurationColor(currentDuration)}">
						{formatDuration(currentDuration)}
					</div>
					{#if currentDuration === null && startDateValue && endDateValue}
						<div class="mt-1 text-xs text-destructive">End time must be after start time</div>
					{/if}
				</div>
			</div>

			<div class="flex-1 overflow-hidden">
				<ScrollArea class="h-full">
					<div class="space-y-6 px-4 pb-4">
						{#if error}
							<div class="rounded-md bg-destructive/10 p-3">
								<p class="text-sm text-destructive">{error}</p>
							</div>
						{/if}

						<!-- Activity Selection -->
						<div class="space-y-2">
							<Label class="text-sm font-medium">Activity</Label>
							{#if activitiesQuery?.loading}
								<div class="rounded-md border p-3 text-center text-sm text-muted-foreground">
									Loading activities...
								</div>
							{:else if activitiesQuery?.current && activitiesQuery.current.length > 0}
								<Select.Root type="single" bind:value={selectedActivityId}>
									<Select.Trigger class="w-full">
										{#if selectedActivity}
											<span class="flex items-center gap-2">
												<span>{selectedActivity.icon}</span>
												<span>{selectedActivity.name}</span>
											</span>
										{:else}
											<span class="text-muted-foreground">Select an activity</span>
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each activitiesQuery.current as act (act.id)}
											<Select.Item value={String(act.id)}>
												<span class="flex items-center gap-2">
													<span>{act.icon}</span>
													<span>{act.name}</span>
													{#if act.categories.length > 0}
														<span class="text-xs text-muted-foreground">
															({act.categories[0].name})
														</span>
													{/if}
												</span>
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{:else}
								<div class="rounded-md border p-3 text-center text-sm text-muted-foreground">
									No activities found. Create an activity first.
								</div>
							{/if}
						</div>

						<!-- Start Time -->
						<div class="space-y-4">
							<div class="text-center">
								<Label class="text-sm font-medium text-muted-foreground">START TIME</Label>
							</div>

							<div class="flex justify-center gap-3">
								<Popover.Root bind:open={startPopoverOpen}>
									<Popover.Trigger>
										<Button
											variant="outline"
											class="justify-between font-normal"
											disabled={loading}
										>
											{startDateValue
												? startDateValue.toDate(getLocalTimeZone()).toLocaleDateString()
												: 'Select date'}
											<ChevronDown class="h-4 w-4" />
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											bind:value={startDateValue}
											onValueChange={() => {
												startPopoverOpen = false;
											}}
											maxValue={today(getLocalTimeZone())}
											captionLayout="dropdown"
										/>
									</Popover.Content>
								</Popover.Root>
								<Input
									type="time"
									bind:value={startTime}
									disabled={loading}
									class="w-28 text-center"
								/>
							</div>

							<div class="rounded-lg bg-muted/30 p-3">
								<div class="mb-2 text-center text-xs text-muted-foreground">Quick Adjust</div>
								<div class="grid grid-cols-6 gap-1">
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', -30)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-30m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', -5)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-5m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', -1)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-1m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', 1)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+1m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', 5)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+5m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('start', 30)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+30m
									</Button>
								</div>
							</div>
						</div>

						<!-- End Time -->
						<div class="space-y-4">
							<div class="text-center">
								<Label class="text-sm font-medium text-muted-foreground">END TIME</Label>
							</div>

							<div class="flex justify-center gap-3">
								<Popover.Root bind:open={endPopoverOpen}>
									<Popover.Trigger>
										<Button
											variant="outline"
											class="justify-between font-normal"
											disabled={loading}
										>
											{endDateValue
												? endDateValue.toDate(getLocalTimeZone()).toLocaleDateString()
												: 'Select date'}
											<ChevronDown class="h-4 w-4" />
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											bind:value={endDateValue}
											onValueChange={() => {
												endPopoverOpen = false;
											}}
											maxValue={today(getLocalTimeZone())}
											captionLayout="dropdown"
										/>
									</Popover.Content>
								</Popover.Root>
								<Input
									type="time"
									bind:value={endTime}
									disabled={loading}
									class="w-28 text-center"
								/>
							</div>

							<div class="rounded-lg bg-muted/30 p-3">
								<div class="mb-2 text-center text-xs text-muted-foreground">Quick Adjust</div>
								<div class="grid grid-cols-6 gap-1">
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', -30)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-30m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', -5)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-5m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', -1)}
										disabled={loading}
										class="px-2 text-xs"
									>
										-1m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', 1)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+1m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', 5)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+5m
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => adjustTime('end', 30)}
										disabled={loading}
										class="px-2 text-xs"
									>
										+30m
									</Button>
								</div>
							</div>
						</div>

						<!-- Notes -->
						<div class="space-y-2">
							<Label class="text-sm font-medium">Notes (optional)</Label>
							<Input
								bind:value={notes}
								placeholder="Add any notes about this session..."
								disabled={loading}
							/>
						</div>
					</div>
				</ScrollArea>
			</div>

			<Drawer.Footer>
				<Button onclick={handleSave} disabled={loading || !selectedActivityId}>
					{loading ? 'Adding...' : 'Add Session'}
				</Button>
				<Button variant="outline" onclick={handleCancel} disabled={loading}>Cancel</Button>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
