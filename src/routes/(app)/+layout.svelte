<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Calendar, ChartColumn, Settings, Timer } from '@lucide/svelte';
	import './../layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-dvh flex-col overflow-hidden bg-muted md:flex-row">
	<Toaster position="top-right" />

	<!-- Navigation Rail (Mid screens) -->
	<nav
		class="hidden h-full w-18 shrink-0 flex-col items-center justify-between border-r border-border bg-card py-6 md:flex lg:hidden"
	>
		<div class="flex flex-col items-center gap-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-105"
			>
				<Timer class="h-5 w-5 animate-pulse" />
			</div>

			<div class="flex flex-col items-center gap-3">
				<a
					href={resolve('/')}
					class={[
						'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
						page.url.pathname === '/'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/' ? 'page' : undefined}
					title="Timer"
				>
					<Timer class="h-5 w-5" />
					<span class="text-[10px] font-medium">Timer</span>
				</a>

				<a
					href={resolve('/daily')}
					class={[
						'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
						page.url.pathname === '/daily'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/daily' ? 'page' : undefined}
					title="Daily"
				>
					<Calendar class="h-5 w-5" />
					<span class="text-[10px] font-medium">Daily</span>
				</a>

				<a
					href={resolve('/stats')}
					class={[
						'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
						page.url.pathname === '/stats'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/stats' ? 'page' : undefined}
					title="Stats"
				>
					<ChartColumn class="h-5 w-5" />
					<span class="text-[10px] font-medium">Stats</span>
				</a>
			</div>
		</div>

		<div class="flex flex-col items-center gap-4">
			<a
				href={resolve('/settings')}
				class={[
					'flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
					page.url.pathname === '/settings'
						? 'bg-primary/10 font-semibold text-primary'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'
				]}
				aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
				title="Settings"
			>
				<Settings class="h-5 w-5" />
				<span class="text-[10px] font-medium">Settings</span>
			</a>
		</div>
	</nav>

	<!-- Sidebar Navigation (Desktop) -->
	<nav
		class="hidden h-full w-64 shrink-0 flex-col justify-between border-r border-border bg-card p-6 lg:flex"
	>
		<div class="flex flex-col gap-8">
			<div class="flex items-center gap-2.5 px-2">
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Timer class="h-5 w-5" />
				</div>
				<span class="font-heading text-lg font-bold tracking-tight text-foreground">Ordo</span>
			</div>

			<div class="space-y-1.5">
				<a
					href={resolve('/')}
					class={[
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
						page.url.pathname === '/'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/' ? 'page' : undefined}
				>
					<Timer class="h-5 w-5" />
					<span>Timer</span>
				</a>

				<a
					href={resolve('/daily')}
					class={[
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
						page.url.pathname === '/daily'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/daily' ? 'page' : undefined}
				>
					<Calendar class="h-5 w-5" />
					<span>Daily</span>
				</a>

				<a
					href={resolve('/stats')}
					class={[
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
						page.url.pathname === '/stats'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/stats' ? 'page' : undefined}
				>
					<ChartColumn class="h-5 w-5" />
					<span>Stats</span>
				</a>

				<a
					href={resolve('/settings')}
					class={[
						'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
						page.url.pathname === '/settings'
							? 'bg-primary/10 font-semibold text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
				>
					<Settings class="h-5 w-5" />
					<span>Settings</span>
				</a>
			</div>
		</div>
	</nav>

	<!-- Main content area with proper scrolling -->
	<main class="h-full flex-1 overflow-y-auto">
		<div class="relative mx-auto h-full w-full max-w-5xl flex flex-col">
			{@render children?.()}
		</div>
	</main>

	<!-- Bottom Navigation - Fixed (Mobile only) -->
	<nav class="shrink-0 border-t border-border bg-card md:hidden">
		<div class="flex items-center justify-around py-3">
			<a
				href={resolve('/')}
				class={[
					'flex flex-col items-center gap-1 transition-colors',
					page.url.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
				]}
				aria-current={page.url.pathname === '/' ? 'page' : undefined}
			>
				<Timer class="h-6 w-6" />
				<span class="text-xs font-medium">Timer</span>
			</a>

			<a
				href={resolve('/daily')}
				class={[
					'flex flex-col items-center gap-1 transition-colors',
					page.url.pathname === '/daily' ? 'text-primary' : 'text-muted-foreground'
				]}
				aria-current={page.url.pathname === '/daily' ? 'page' : undefined}
			>
				<Calendar class="h-6 w-6" />
				<span class="text-xs font-medium">Daily</span>
			</a>

			<a
				href={resolve('/stats')}
				class={[
					'flex flex-col items-center gap-1 transition-colors',
					page.url.pathname === '/stats' ? 'text-primary' : 'text-muted-foreground'
				]}
				aria-current={page.url.pathname === '/stats' ? 'page' : undefined}
			>
				<ChartColumn class="h-6 w-6" />
				<span class="text-xs font-medium">Stats</span>
			</a>

			<a
				href={resolve('/settings')}
				class={[
					'flex flex-col items-center gap-1 transition-colors',
					page.url.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'
				]}
				aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
			>
				<Settings class="h-6 w-6" />
				<span class="text-xs font-medium">Settings</span>
			</a>
		</div>
	</nav>
</div>
