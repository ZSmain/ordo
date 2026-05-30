<script lang="ts">
	import { updateSession } from '$lib/api/daily.remote';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
	import { ChevronDown, Clock } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		session: {
			id: number;
			startedAt: Date;
			stoppedAt: Date | null;
			activity: {
				name: string;
				icon: string;
			};
		};
		onOpenChange: (open: boolean) => void;
		onSessionUpdated: () => void;
	}

	function jsDateToCalendarDate(date: Date): CalendarDate {
		return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	}

	function formatTimeForInput(date: Date): string {
		return date.toTimeString().slice(0, 5);
	}

	let { session, onOpenChange, onSessionUpdated }: Props = $props();

	function getInitialSession() {
		return session;
	}

	const initialSession = getInitialSession();
	const initialEndAt = initialSession.stoppedAt;

	let startDateValue = $state<CalendarDate | undefined>(
		jsDateToCalendarDate(initialSession.startedAt)
	);
	let startTime = $state(formatTimeForInput(initialSession.startedAt));
	let endDateValue = $state<CalendarDate | undefined>(
		initialEndAt ? jsDateToCalendarDate(initialEndAt) : undefined
	);
	let endTime = $state(initialEndAt ? formatTimeForInput(initialEndAt) : '');
	let startPopoverOpen = $state(false);
	let endPopoverOpen = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

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

		const newCalendarDate = jsDateToCalendarDate(currentDateTime);
		const newTimeStr = formatTimeForInput(currentDateTime);

		if (field === 'start') {
			startDateValue = newCalendarDate;
			startTime = newTimeStr;
		} else {
			endDateValue = newCalendarDate;
			endTime = newTimeStr;
		}
	}

	async function handleSave() {
		try {
			loading = true;
			error = null;

			if (!startDateValue || !endDateValue) {
				error = 'Please select both start and end dates';
				return;
			}

			const startDateTime = calendarDateToJSDate(startDateValue, startTime);
			const endDateTime = calendarDateToJSDate(endDateValue, endTime);

			if (endDateTime <= startDateTime) {
				error = 'End time must be after start time';
				return;
			}

			await updateSession({
				sessionId: session.id,
				startedAt: startDateTime.toISOString(),
				stoppedAt: endDateTime.toISOString()
			});

			toast.success('Session updated');
			onSessionUpdated();
			onOpenChange(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update session';
			toast.error('Failed to update session');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		onOpenChange(false);
	}

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
			if (remainingSeconds === 0) {
				return `${minutes}m`;
			}
			return `${minutes}m ${remainingSeconds}s`;
		}

		return `${remainingSeconds}s`;
	}

	function getDurationColor(duration: number | null): string {
		if (!duration || duration <= 0) return 'text-muted-foreground';
		if (duration < 300) return 'text-orange-600';
		if (duration < 3600) return 'text-blue-600';
		return 'text-green-600';
	}
</script>

<div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
	<Drawer.Header>
		<Drawer.Title class="text-center">
			<div class="mb-2 flex items-center justify-center gap-2">
				<span class="text-xl">{session.activity.icon}</span>
				<span class="font-semibold">Modify Session</span>
			</div>
			<div class="text-sm font-normal text-muted-foreground">
				{session.activity.name}
			</div>
		</Drawer.Title>
	</Drawer.Header>

	<div class="px-4 pb-2">
		<div class="rounded-lg bg-muted/50 p-2 text-center">
			<div class="mb-1 flex items-center justify-center gap-2">
				<Clock class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">Duration</span>
			</div>
			<div class="text-2xl font-bold {getDurationColor(currentDuration)}">
				{formatDuration(currentDuration)}
			</div>
			{#if currentDuration === null && startDateValue && endDateValue}
				<div class="mt-1 text-xs text-red-500">End time must be after start time</div>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="space-y-2 px-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<div class="rounded-lg bg-muted/50 p-2">
				<div class="text-center">
					<Label class="text-sm font-medium text-muted-foreground">START TIME</Label>
				</div>

				<div class="flex justify-center gap-3">
					<Popover.Root bind:open={startPopoverOpen}>
						<Popover.Trigger>
							<Button variant="outline" class="justify-between font-normal" disabled={loading}>
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
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
					<Input type="time" bind:value={startTime} disabled={loading} class="w-28 text-center" />
				</div>

				<div class="rounded-lg bg-muted/30 p-2">
					<div class="mb-2 text-center text-xs text-muted-foreground">Quick Adjust</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="grid grid-cols-3 gap-1">
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', -30)}
								disabled={loading}
								class="rounded-md text-xs">-30m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', -5)}
								disabled={loading}
								class="rounded-md text-xs">-5m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', -1)}
								disabled={loading}
								class="rounded-md text-xs">-1m</Button
							>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', 1)}
								disabled={loading}
								class="rounded-md text-xs">+1m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', 5)}
								disabled={loading}
								class="rounded-md text-xs">+5m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('start', 30)}
								disabled={loading}
								class="rounded-md text-xs">+30m</Button
							>
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-2 rounded-lg bg-muted/50 p-2">
				<div class="text-center">
					<Label class="text-sm font-medium text-muted-foreground">END TIME</Label>
				</div>

				<div class="flex justify-center gap-3">
					<Popover.Root bind:open={endPopoverOpen}>
						<Popover.Trigger>
							<Button variant="outline" class="justify-between font-normal" disabled={loading}>
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
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
					<Input type="time" bind:value={endTime} disabled={loading} class="w-28 text-center" />
				</div>

				<div class="rounded-lg bg-muted/30 p-2">
					<div class="mb-2 text-center text-xs text-muted-foreground">Quick Adjust</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="grid grid-cols-3 gap-1">
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', -30)}
								disabled={loading}
								class="rounded-md px-2 text-xs">-30m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', -5)}
								disabled={loading}
								class="rounded-md px-2 text-xs">-5m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', -1)}
								disabled={loading}
								class="rounded-md px-2 text-xs">-1m</Button
							>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', 1)}
								disabled={loading}
								class="rounded-md px-2 text-xs">+1m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', 5)}
								disabled={loading}
								class="rounded-md px-2 text-xs">+5m</Button
							>
							<Button
								variant="outline"
								size="sm"
								onclick={() => adjustTime('end', 30)}
								disabled={loading}
								class="rounded-md px-2 text-xs">+30m</Button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<Drawer.Footer class="shrink-0">
	<Button onclick={handleSave} disabled={loading}>
		{loading ? 'Saving...' : 'Save Changes'}
	</Button>
	<Button variant="outline" onclick={handleCancel} disabled={loading}>Cancel</Button>
</Drawer.Footer>
