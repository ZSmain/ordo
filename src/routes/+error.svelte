<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { TriangleAlert } from '@lucide/svelte';
</script>

<div class="flex min-h-screen items-center justify-center bg-muted p-4">
	<Card.Root class="w-full max-w-md shadow-xl">
		<Card.Header class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
			>
				<TriangleAlert class="h-8 w-8 text-destructive" />
			</div>
			<Card.Title class="text-2xl">
				{#if page.status === 404}
					Page Not Found
				{:else}
					Something Went Wrong
				{/if}
			</Card.Title>
			<Card.Description class="text-muted-foreground">
				{page.error?.message || 'An unexpected error occurred'}
			</Card.Description>
		</Card.Header>
		<Card.Content class="text-center">
			<span
				class="inline-block rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive"
			>
				Error {page.status}
			</span>
		</Card.Content>
		<Card.Footer class="justify-center">
			<Button href="/" variant="default">Back to Home</Button>
		</Card.Footer>
	</Card.Root>
</div>
