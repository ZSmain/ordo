<script lang="ts">
	import { formatDuration } from '$lib/time';

	interface OverviewStats {
		totalDuration: number;
		totalSessions: number;
		categoriesWorkedOn: number;
		activitiesWorkedOn: number;
	}

	interface Props {
		stats: OverviewStats;
		period: string;
	}

	let { stats, period }: Props = $props();
</script>

<div class="rounded-lg bg-muted/50 p-6 select-none">
	<h3 class="mb-4 text-lg font-semibold">Overview for {period}</h3>
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="text-center">
			<p class="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
			<p class="text-sm text-muted-foreground">Total Time</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold">{stats.totalSessions}</p>
			<p class="text-sm text-muted-foreground">Sessions</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold">{stats.categoriesWorkedOn}</p>
			<p class="text-sm text-muted-foreground">Categories</p>
		</div>
		<div class="text-center">
			<p class="text-2xl font-bold">{stats.activitiesWorkedOn}</p>
			<p class="text-sm text-muted-foreground">Activities</p>
		</div>
	</div>
</div>
