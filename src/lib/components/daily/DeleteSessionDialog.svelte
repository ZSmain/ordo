<script lang="ts">
	import { deleteSession } from '$lib/api/daily.remote';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		open: boolean;
		session: {
			id: number;
			startedAt: Date;
			stoppedAt: Date | null;
			duration: number | null;
			activity: {
				name: string;
				icon: string;
			};
		};
		userId: string;
		onOpenChange: (open: boolean) => void;
		onSessionDeleted: () => void;
	}

	let { open = $bindable(), session, userId, onOpenChange, onSessionDeleted }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

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

	async function handleDelete() {
		try {
			loading = true;
			error = null;

			await deleteSession({
				sessionId: session.id,
				userId
			});

			// Notify parent component
			onSessionDeleted();
			onOpenChange(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete session';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		onOpenChange(false);
	}

	// Reset error when dialog opens
	$effect(() => {
		if (open) {
			error = null;
		}
	});
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-red-600">
				<Trash2 class="h-5 w-5" />
				Delete Session
			</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. The session will be permanently deleted.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if error}
				<div class="rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			<!-- Session details -->
			<div class="rounded-lg border bg-muted/50 p-4">
				<div class="flex items-center gap-3">
					<span class="text-lg">{session.activity.icon}</span>
					<div class="flex-1">
						<h3 class="font-medium">{session.activity.name}</h3>
						<p class="text-sm text-muted-foreground">
							{formatTimeRange(session.startedAt, session.stoppedAt)}
						</p>
						<p class="text-sm text-muted-foreground">
							Duration: {formatDuration(session.duration)}
						</p>
					</div>
				</div>
			</div>

			<p class="text-sm text-muted-foreground">
				Are you sure you want to delete this session? This will permanently remove the time tracking
				record.
			</p>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel} disabled={loading}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={loading}>
				{loading ? 'Deleting...' : 'Delete Session'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
