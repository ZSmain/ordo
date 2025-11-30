<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { House, LogIn, TriangleAlert } from '@lucide/svelte';
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
				{:else if page.status === 401}
					Authentication Required
				{:else}
					Something Went Wrong
				{/if}
			</Card.Title>
			<Card.Description class="text-muted-foreground">
				{#if page.status === 401}
					Please log in to access this page.
				{:else}
					{page.error?.message || 'An unexpected error occurred'}
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content class="text-center">
			<span
				class="inline-block rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive"
			>
				Error {page.status}
			</span>
		</Card.Content>
		<Card.Footer class="justify-center gap-2">
			{#if page.status === 401}
				<Button href="/login" variant="default">
					<LogIn class="mr-2 h-4 w-4" />
					Log In
				</Button>
			{:else}
				<Button href="/" variant="default">
					<House class="mr-2 h-4 w-4" />
					Back to Home
				</Button>
			{/if}
		</Card.Footer>
	</Card.Root>
</div>
