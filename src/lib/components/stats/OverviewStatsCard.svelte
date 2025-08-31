<script lang="ts">
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

	function formatDuration(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours === 0) {
			return `${minutes}m`;
		}

		return `${hours}h ${minutes}m`;
	}
</script>

<div class="rounded-lg bg-muted/50 p-6">
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
