export function formatTime(seconds: number) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDuration(seconds: number | null | undefined) {
	const totalSeconds = Math.max(0, Math.round(seconds ?? 0));

	if (totalSeconds === 0) {
		return '0s';
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const secs = totalSeconds % 60;
	const parts: string[] = [];

	if (hours > 0) {
		parts.push(`${hours}h`);
	}

	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}

	if (secs > 0) {
		parts.push(`${secs}s`);
	}

	return parts.join(' ');
}

export function formatTimeRange(
	startedAt: Date | string,
	stoppedAt: Date | string | null
): string {
	const start = new Date(startedAt).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	if (!stoppedAt) {
		return `${start} - ongoing`;
	}

	const end = new Date(stoppedAt).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	return `${start} - ${end}`;
}
