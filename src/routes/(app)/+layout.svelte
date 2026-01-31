<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Calendar, ChartColumn, Settings, Timer } from '@lucide/svelte';
	import '../../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

<div class="flex h-dvh flex-col overflow-hidden bg-muted">
	<!-- Main content area with proper scrolling -->
	<main class="flex-1 overflow-y-auto">
		{@render children?.()}
	</main>

	<!-- Bottom Navigation - Fixed -->
	<nav class="shrink-0 border-t border-border bg-background">
		<div class="flex items-center justify-around py-3">
			<a
				href={resolve('/')}
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-primary={page.url.pathname === '/'}
				class:text-muted-foreground={page.url.pathname !== '/'}
				aria-current={page.url.pathname === '/' ? 'page' : undefined}
			>
				<Timer class="h-6 w-6" />
				<span class="text-xs font-medium">Timer</span>
			</a>

			<a
				href={resolve('/daily')}
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-primary={page.url.pathname === '/daily'}
				class:text-muted-foreground={page.url.pathname !== '/daily'}
				aria-current={page.url.pathname === '/daily' ? 'page' : undefined}
			>
				<Calendar class="h-6 w-6" />
				<span class="text-xs font-medium">Daily</span>
			</a>

			<a
				href={resolve('/stats')}
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-primary={page.url.pathname === '/stats'}
				class:text-muted-foreground={page.url.pathname !== '/stats'}
				aria-current={page.url.pathname === '/stats' ? 'page' : undefined}
			>
				<ChartColumn class="h-6 w-6" />
				<span class="text-xs font-medium">Stats</span>
			</a>

			<a
				href={resolve('/settings')}
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-primary={page.url.pathname === '/settings'}
				class:text-muted-foreground={page.url.pathname !== '/settings'}
				aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
			>
				<Settings class="h-6 w-6" />
				<span class="text-xs font-medium">Settings</span>
			</a>
		</div>
	</nav>
</div>
