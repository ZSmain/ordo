<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import ModifySessionDrawerContent from './ModifySessionDrawerContent.svelte';

	interface Props {
		open: boolean;
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

	let { open = $bindable(), session, onOpenChange, onSessionUpdated }: Props = $props();
</script>

<Drawer.Root {open} {onOpenChange}>
	{#if open}
		<Drawer.Content>
			<ModifySessionDrawerContent {session} {onOpenChange} {onSessionUpdated} />
		</Drawer.Content>
	{/if}
</Drawer.Root>
