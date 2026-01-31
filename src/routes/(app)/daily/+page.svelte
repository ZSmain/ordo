<script lang="ts">
	import { AddSessionDrawer, SessionCard } from '$lib/components/daily';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Dialog from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from '@lucide/svelte';
	import type { PageProps } from './$types';

	import {
		useLiveStore,
		completedSessionsForUser$,
		allActivitiesForUser$,
		activityCategoryLinks$,
		categoriesForUser$
	} from '$lib/livestore';

	const store = useLiveStore();

	let { data }: PageProps = $props();

	// Current selected date (defaults to today)
	let selectedDateValue = $state(today(getLocalTimeZone()));
	let calendarOpen = $state(false);
	let addSessionOpen = $state(false);

	// Get all data from LiveStore
	const allSessions = $derived(data.user ? store.query(completedSessionsForUser$(data.user.id)) : []);
	const activities = $derived(data.user ? store.query(allActivitiesForUser$(data.user.id)) : []);
	const categories = $derived(data.user ? store.query(categoriesForUser$(data.user.id)) : []);
	const activityCategoryLinks = $derived(store.query(activityCategoryLinks$));

	// Filter sessions for the selected date
	const sessions = $derived.by(() => {
		const dateStr = formatDateForAPI(selectedDateValue);
		const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
		const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

		return allSessions
			.filter((session) => {
				const sessionStart = new Date(session.startedAt);
				return sessionStart >= startOfDay && sessionStart < endOfDay && session.stoppedAt;
			})
			.map((session) => {
				const activity = activities.find((a) => a.id === session.activityId);
				const categoryLinksForActivity = activityCategoryLinks.filter(
					(link) => link.activityId === session.activityId
				);
				const sessionCategories = categoryLinksForActivity
					.map((link) => categories.find((c) => c.id === link.categoryId))
					.filter(Boolean);

				return {
					id: session.id,
					startedAt: new Date(session.startedAt),
					stoppedAt: session.stoppedAt ? new Date(session.stoppedAt) : null,
					duration: session.duration,
					notes: session.notes,
					activity: activity
						? {
								id: activity.id,
								name: activity.name,
								icon: activity.icon
							}
						: { id: session.activityId, name: 'Unknown', icon: '❓' },
					categories: sessionCategories.map((cat) => ({
						id: cat!.id,
						name: cat!.name,
						color: cat!.color,
						icon: cat!.icon
					}))
				};
			})
			.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
	});

	// Convert DateValue to JS Date for display formatting
	function dateValueToJSDate(dateValue: CalendarDate): Date {
		return new Date(dateValue.year, dateValue.month - 1, dateValue.day);
	}

	// Format date for display
	function formatDisplayDate(dateValue: CalendarDate) {
		const jsDate = dateValueToJSDate(dateValue);
		const todayDate = new Date();
		// Use milliseconds to avoid mutable Date methods
		const yesterday = new Date(todayDate.getTime() - 86400000);
		const tomorrow = new Date(todayDate.getTime() + 86400000);

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

	// Handle calendar date selection
	function handleDateSelect() {
		calendarOpen = false;
	}

	// Calculate total duration for the day
	function getTotalDuration(sessions: { duration: number | null }[]) {
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

	// No-op - sessions are reactive from LiveStore
	function handleSessionUpdated() {
		// Sessions update automatically via LiveStore reactivity
	}
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
					<p class="text-2xl font-bold">{formatDuration(getTotalDuration(sessions))}</p>
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
					{#if sessions.length === 0}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">No sessions recorded for this day.</p>
							<p class="mt-2 text-sm text-muted-foreground">
								Tap the + button to log a past activity
							</p>
						</div>
					{:else}
						{#each sessions as session, index (session.id + '-' + index)}
							<SessionCard
								{session}
								userId={data.user.id}
								onSessionUpdated={handleSessionUpdated}
							/>
						{/each}
					{/if}
				</div>
			</div>
		</ScrollArea>
	</div>

	<!-- Date navigation -->
	<div class="border-t bg-background/80 p-1.5 backdrop-blur-sm">
		<div class="container mx-auto flex max-w-2xl items-center justify-between">
			<Button variant="ghost" size="icon" onclick={goToPreviousDay}>
				<ChevronLeft class="size-4" />
			</Button>

			<Dialog.Root bind:open={calendarOpen}>
				<Dialog.Trigger
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<CalendarIcon class="size-4" />
					<span class="font-medium">{formatDisplayDate(selectedDateValue)}</span>
				</Dialog.Trigger>
				<Dialog.Content class="w-auto max-w-fit">
					<Dialog.Header>
						<Dialog.Title>Select Date</Dialog.Title>
					</Dialog.Header>
					<div class="flex justify-center p-4">
						<Calendar
							type="single"
							bind:value={selectedDateValue}
							initialFocus
							maxValue={today(getLocalTimeZone())}
							class="rounded-md border"
							onValueChange={handleDateSelect}
						/>
					</div>
				</Dialog.Content>
			</Dialog.Root>

			<Button variant="ghost" size="icon" onclick={goToNextDay} disabled={!canGoToNextDay()}>
				<ChevronRight class="size-4" />
			</Button>
		</div>
	</div>
</div>

<!-- Floating Add Button -->
<div class="fixed right-6 bottom-32 z-50">
	<Button
		size="lg"
		class="h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
		onclick={() => (addSessionOpen = true)}
	>
		<Plus class="h-6 w-6" />
	</Button>
</div>

<!-- Add Session Drawer -->
{#if data.user}
	<AddSessionDrawer
		bind:open={addSessionOpen}
		userId={data.user.id}
		selectedDate={selectedDateValue}
		onOpenChange={(open) => (addSessionOpen = open)}
		onSessionCreated={handleSessionUpdated}
	/>
{/if}
