<script lang="ts">
	import { onMount } from 'svelte';
	import { _setStoreInstance } from './context';

	interface Props {
		userId: string;
		children?: import('svelte').Snippet;
	}

	let { userId, children }: Props = $props();

	let initialized = $state(false);
	let error = $state<Error | null>(null);

	onMount(async () => {
		try {
			// Dynamically import and initialize the store on the client
			const { getStore } = await import('./store');
			const store = await getStore(userId);
			// Set module-level store instance
			_setStoreInstance(store, userId);
			initialized = true;
		} catch (e) {
			console.error('Failed to initialize LiveStore:', e);
			error = e instanceof Error ? e : new Error('Failed to initialize LiveStore');
		}
	});
</script>

{#if !initialized && !error}
	<div class="flex h-full items-center justify-center">
		<div class="animate-pulse text-muted-foreground">Loading...</div>
	</div>
{:else if error}
	<div class="flex h-full items-center justify-center">
		<div class="text-destructive">Error: {error.message}</div>
	</div>
{:else}
	{@render children?.()}
{/if}


