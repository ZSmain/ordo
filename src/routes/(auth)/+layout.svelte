<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Authentication - Ordo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{@render children?.()}
</div>
