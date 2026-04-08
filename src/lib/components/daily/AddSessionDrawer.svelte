<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import type { CalendarDate } from '@internationalized/date';
	import AddSessionDrawerContent from './AddSessionDrawerContent.svelte';

	interface Props {
		open: boolean;
		userId: string;
		selectedDate: CalendarDate;
		onOpenChange: (open: boolean) => void;
		onSessionCreated: () => void;
	}

	let {
		open = $bindable(),
		userId,
		selectedDate,
		onOpenChange,
		onSessionCreated
	}: Props = $props();
</script>

<Drawer.Root {open} {onOpenChange}>
	{#if open}
		<Drawer.Content class="flex flex-col">
			<AddSessionDrawerContent {userId} {selectedDate} {onOpenChange} {onSessionCreated} />
		</Drawer.Content>
	{/if}
</Drawer.Root>
