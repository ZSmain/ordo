<script lang="ts">
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

<div class="flex h-dvh flex-col overflow-hidden bg-gray-100">
	<!-- Main content area with proper scrolling -->
	<main class="flex-1 overflow-y-auto">
		{@render children?.()}
	</main>

	<!-- Bottom Navigation - Fixed -->
	<nav class="flex-shrink-0 border-t border-gray-200 bg-white">
		<div class="flex items-center justify-around py-3">
			<a
				href="/"
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-blue-600={page.url.pathname === '/'}
				class:text-gray-600={page.url.pathname !== '/'}
			>
				<Timer class="h-6 w-6" />
				<span class="text-xs font-medium">Timer</span>
			</a>

			<a
				href="/daily"
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-blue-600={page.url.pathname === '/daily'}
				class:text-gray-600={page.url.pathname !== '/daily'}
			>
				<Calendar class="h-6 w-6" />
				<span class="text-xs font-medium">Daily</span>
			</a>

			<a
				href="/stats"
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-blue-600={page.url.pathname === '/stats'}
				class:text-gray-600={page.url.pathname !== '/stats'}
			>
				<ChartColumn class="h-6 w-6" />
				<span class="text-xs font-medium">Stats</span>
			</a>

			<a
				href="/settings"
				class="flex flex-col items-center gap-1 transition-colors"
				class:text-blue-600={page.url.pathname === '/settings'}
				class:text-gray-600={page.url.pathname !== '/settings'}
			>
				<Settings class="h-6 w-6" />
				<span class="text-xs font-medium">Settings</span>
			</a>
		</div>
	</nav>
</div>
