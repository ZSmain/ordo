<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		session: {
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
			category: {
				id: number;
				name: string;
				color: string;
				icon: string;
			};
		};
	}

	let { session }: Props = $props();

	function formatTimeRange(startedAt: Date, stoppedAt: Date | null) {
		const start = new Date(startedAt).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		if (!stoppedAt) return `${start} - ongoing`;

		const end = new Date(stoppedAt).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		return `${start} - ${end}`;
	}

	function formatDuration(seconds: number | null) {
		if (!seconds) return '0s';

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${remainingSeconds}s`;
		}

		if (remainingSeconds === 0) {
			return `${minutes}m`;
		}

		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

<div
	class="mb-1.5 rounded-lg border p-1 transition-colors hover:opacity-90"
	style="background-color: {session.category.color}10"
>
	<div class="flex items-start justify-between gap-2">
		<div class="flex flex-1 items-center gap-3">
			<!-- Activity icon -->
			<span class="flex-shrink-0 text-lg">{session.activity.icon}</span>

			<!-- Activity info -->
			<div class="min-w-0 flex-1">
				<div class="mb-1">
					<h3 class="truncate text-sm font-medium">
						{session.category.name} / {session.activity.name}
					</h3>
				</div>

				<div class="mt-1 text-xs text-muted-foreground">
					{formatTimeRange(session.startedAt, session.stoppedAt)}
				</div>
			</div>
		</div>

		<!-- Duration -->
		<div class="flex-shrink-0 text-right">
			<Badge variant="secondary" class="text-xs">
				{formatDuration(session.duration)}
			</Badge>
		</div>
	</div>

	<!-- Notes -->
	{#if session.notes}
		<div class="mt-3 border-t pt-3 text-xs text-muted-foreground">
			{session.notes}
		</div>
	{/if}
</div>
