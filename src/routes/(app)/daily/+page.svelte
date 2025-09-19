<script lang="ts">
	import { SessionCard } from '$lib/components/daily';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { CalendarIcon, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { getSessionsForDate } from './daily.remote';

	let { data }: PageProps = $props();

	// Current selected date (defaults to today)
	let selectedDateValue = $state(today(getLocalTimeZone()));
	let sessions = $state<any[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let calendarOpen = $state(false);

	// Convert DateValue to JS Date for display formatting
	function dateValueToJSDate(dateValue: CalendarDate): Date {
		return new Date(dateValue.year, dateValue.month - 1, dateValue.day);
	}

	// Convert JS Date to DateValue for calendar
	function jsDateToDateValue(jsDate: Date): CalendarDate {
		return new CalendarDate(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate());
	}

	// Format date for display
	function formatDisplayDate(dateValue: CalendarDate) {
		const jsDate = dateValueToJSDate(dateValue);
		const todayDate = new Date();
		const yesterday = new Date();
		yesterday.setDate(todayDate.getDate() - 1);
		const tomorrow = new Date();
		tomorrow.setDate(todayDate.getDate() + 1);

		if (jsDate.toDateString() === todayDate.toDateString()) {
			return 'Today';
		} else if (jsDate.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else if (jsDate.toDateString() === tomorrow.toDateString()) {
			return 'Tomorrow';
		} else {
			return jsDate.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		}
	}

	// Format date for API (YYYY-MM-DD)
	function formatDateForAPI(dateValue: CalendarDate) {
		const year = dateValue.year;
		const month = String(dateValue.month).padStart(2, '0');
		const day = String(dateValue.day).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Navigate to previous day
	function goToPreviousDay() {
		selectedDateValue = selectedDateValue.subtract({ days: 1 });
	}

	// Navigate to next day
	function goToNextDay() {
		const tomorrow = selectedDateValue.add({ days: 1 });
		const todayDate = today(getLocalTimeZone());

		// Don't allow navigation to future dates
		if (tomorrow.compare(todayDate) <= 0) {
			selectedDateValue = tomorrow;
		}
	}

	// Check if we can navigate to next day (not in future)
	function canGoToNextDay() {
		const tomorrow = selectedDateValue.add({ days: 1 });
		const todayDate = today(getLocalTimeZone());
		return tomorrow.compare(todayDate) <= 0;
	}

	// Load sessions for the selected date
	async function loadSessions() {
		if (!data.user) return;

		loading = true;
		error = null;
		try {
			const dateStr = formatDateForAPI(selectedDateValue);
			sessions = await getSessionsForDate({ userId: data.user.id, date: dateStr });
		} catch (err) {
			error = 'Failed to load sessions. Please try again.';
			sessions = [];
		} finally {
			loading = false;
		}
	}

	// Handle calendar date selection
	function handleDateSelect() {
		calendarOpen = false;
	}

	// Calculate total duration for the day
	function getTotalDuration() {
		return sessions.reduce((total, session) => total + (session.duration || 0), 0);
	}

	function formatDuration(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours === 0) {
			return `${minutes}m`;
		}

		return `${hours}h ${minutes}m`;
	}

	// Load sessions when component mounts or date changes
	$effect(() => {
		loadSessions();
	});
</script>

<svelte:head>
	<title>Ordo - Daily</title>
</svelte:head>

<div
	class="grid h-full"
	class:grid-rows-[auto_1fr_auto]={sessions.length > 0}
	class:grid-rows-[1fr_auto]={sessions.length === 0}
>
	<!-- Total duration summary -->
	{#if sessions.length > 0}
		<div class="container mx-auto max-w-2xl p-4 pb-0">
			<div class="rounded-lg bg-muted/50 p-4">
				<div class="text-center">
					<p class="text-sm text-muted-foreground">Total time tracked</p>
					<p class="text-2xl font-bold">{formatDuration(getTotalDuration())}</p>
					<p class="text-sm text-muted-foreground">
						{sessions.length} session{sessions.length === 1 ? '' : 's'}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Content area -->
	<div class="overflow-hidden">
		<ScrollArea class="h-full">
			<div class="container mx-auto max-w-2xl p-4">
				<!-- Sessions list -->
				<div class="space-y-4">
					{#if loading}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">Loading sessions...</p>
						</div>
					{:else if error}
						<div class="py-8 text-center">
							<p class="text-red-500">{error}</p>
						</div>
					{:else if sessions.length === 0}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">No sessions recorded for this day.</p>
							<p class="mt-2 text-sm text-muted-foreground">
								Start tracking activities to see them here!
							</p>
						</div>
					{:else}
						{#each sessions as session (session.id)}
							<SessionCard {session} />
						{/each}
					{/if}
				</div>
			</div></ScrollArea
		>
	</div>

	<!-- Date navigation -->
	<div class="border-t bg-background/80 p-1.5 backdrop-blur-sm">
		<div class="container mx-auto flex max-w-2xl items-center justify-between">
			<Button variant="ghost" size="icon" onclick={goToPreviousDay}>
				<ChevronLeft class="size-4" />
			</Button>

			<Dialog bind:open={calendarOpen}>
				<DialogTrigger
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<CalendarIcon class="size-4" />
					<span class="font-medium">{formatDisplayDate(selectedDateValue)}</span>
				</DialogTrigger>
				<DialogContent class="w-auto max-w-fit">
					<DialogHeader>
						<DialogTitle>Select Date</DialogTitle>
					</DialogHeader>
					<div class="flex justify-center p-4">
						<Calendar
							type="single"
							bind:value={selectedDateValue}
							initialFocus
							maxValue={today(getLocalTimeZone())}
							class="rounded-md border"
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Button variant="ghost" size="icon" onclick={goToNextDay} disabled={!canGoToNextDay()}>
				<ChevronRight class="size-4" />
			</Button>
		</div>
	</div>
</div>
