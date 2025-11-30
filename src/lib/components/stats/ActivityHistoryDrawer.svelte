<script lang="ts">
	import { SessionCard } from '$lib/components/daily';
	import * as Drawer from '$lib/components/ui/drawer';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Clock, History } from '@lucide/svelte';
	import { getSessionsForActivity } from '../../../routes/(app)/stats/stats.remote';

	interface ActivityInfo {
		id: number;
		name: string;
		icon: string;
	}

	interface Props {
		open: boolean;
		activity: ActivityInfo | null;
		userId: string;
		startDate: string;
		endDate: string;
		onOpenChange: (open: boolean) => void;
	}

	let { open = $bindable(), activity, userId, startDate, endDate, onOpenChange }: Props = $props();

	interface Session {
		id: number;
		startedAt: Date;
		stoppedAt: Date | null;
		duration: number | null;
		notes: string | null;
		activity: {
			id: number;
			name: string;
			icon: string;
		};
		categories: Array<{
			id: number;
			name: string;
			color: string;
			icon: string;
		}>;
	}

	// Reactive query that updates when activity changes
	const sessionsQuery = $derived.by(() => {
		if (!open || !activity) return null;
		return getSessionsForActivity({
			userId,
			activityId: activity.id,
			startDate,
			endDate
		});
	});

	function handleSessionUpdated() {
		sessionsQuery?.refresh();
	}

	// Group sessions by date
	let groupedSessions = $derived.by(() => {
		const sessions = (sessionsQuery?.current ?? []) as Session[];
		const groups: [string, Session[]][] = [];
		const groupMap: Record<string, Session[]> = {};

		sessions.forEach((session) => {
			const date = new Date(session.startedAt).toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});

			if (!groupMap[date]) {
				groupMap[date] = [];
				groups.push([date, groupMap[date]]);
			}
			groupMap[date].push(session);
		});

		return groups;
	});

	// Calculate total duration
	let totalDuration = $derived(
		((sessionsQuery?.current ?? []) as Session[]).reduce((sum, s) => sum + (s.duration || 0), 0)
	);

	let sessionCount = $derived(((sessionsQuery?.current ?? []) as Session[]).length);

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours === 0) {
			return `${minutes}m`;
		}

		return `${hours}h ${minutes}m`;
	}
</script>

<Drawer.Root {open} {onOpenChange}>
	<Drawer.Content class="max-h-[85vh]">
		<div class="mx-auto flex h-full w-full max-w-md flex-col">
			<Drawer.Header>
				<Drawer.Title class="text-center">
					<div class="mb-2 flex items-center justify-center gap-2">
						<span class="text-xl">{activity?.icon}</span>
						<span class="font-semibold">{activity?.name}</span>
					</div>
					<div
						class="flex items-center justify-center gap-2 text-sm font-normal text-muted-foreground"
					>
						<History class="h-4 w-4" />
						<span>Session History</span>
					</div>
				</Drawer.Title>
			</Drawer.Header>

			<svelte:boundary>
				{#snippet pending()}
					<div class="py-8 text-center">
						<p class="text-muted-foreground">Loading sessions...</p>
					</div>
				{/snippet}

				{#snippet failed()}
					<div class="py-8 text-center">
						<p class="text-red-500">Failed to load session history</p>
					</div>
				{/snippet}

				<!-- Summary -->
				{#if sessionCount > 0}
					<div class="px-4 pb-4">
						<div class="flex items-center justify-center gap-6 rounded-lg bg-muted/50 p-3">
							<div class="text-center">
								<div class="text-2xl font-bold">{sessionCount}</div>
								<div class="text-xs text-muted-foreground">
									session{sessionCount !== 1 ? 's' : ''}
								</div>
							</div>
							<div class="h-8 w-px bg-border"></div>
							<div class="text-center">
								<div class="flex items-center gap-1">
									<Clock class="h-4 w-4 text-muted-foreground" />
									<span class="text-2xl font-bold">{formatDuration(totalDuration)}</span>
								</div>
								<div class="text-xs text-muted-foreground">total time</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Sessions List -->
				<div class="flex-1 overflow-hidden px-4 pb-4">
					{#if sessionCount === 0}
						<div class="py-8 text-center">
							<p class="text-muted-foreground">No sessions recorded for this period.</p>
						</div>
					{:else}
						<ScrollArea class="h-[40vh]">
							<div class="space-y-4 pr-4">
								{#each groupedSessions as [date, dateSessions] (date)}
									<div>
										<h4 class="mb-2 text-sm font-medium text-muted-foreground">{date}</h4>
										<div class="space-y-1">
											{#each dateSessions as session (session.id)}
												<SessionCard {session} {userId} onSessionUpdated={handleSessionUpdated} />
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</ScrollArea>
					{/if}
				</div>
			</svelte:boundary>

			<Drawer.Footer>
				<Drawer.Close class="w-full">
					<button
						class="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
					>
						Close
					</button>
				</Drawer.Close>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
