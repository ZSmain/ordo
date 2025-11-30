<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		addRecentEmoji,
		EMOJI_CATEGORIES,
		getRecentEmojis,
		searchEmojis,
		type EmojiCategory
	} from '$lib/constants/emojis';
	import { Search } from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface Props {
		value: string;
		onSelect: (emoji: string) => void;
		class?: string;
	}

	let { value, onSelect, class: className = '' }: Props = $props();

	let open = $state(false);
	let searchQuery = $state('');
	let activeTab = $state<EmojiCategory | 'recent'>('recent');
	let recentEmojis = $state<string[]>([]);

	// Load recent emojis on mount
	onMount(() => {
		recentEmojis = getRecentEmojis();
		// If no recent emojis, default to productivity tab
		if (recentEmojis.length === 0) {
			activeTab = 'productivity';
		}
	});

	// Get emojis based on active tab and search
	const displayEmojis = $derived.by(() => {
		if (searchQuery.trim()) {
			// Search across all emojis by keyword
			return searchEmojis(searchQuery);
		}

		if (activeTab === 'recent') {
			return recentEmojis;
		}

		return EMOJI_CATEGORIES[activeTab]?.emojis || [];
	});

	function handleEmojiSelect(emoji: string) {
		addRecentEmoji(emoji);
		recentEmojis = getRecentEmojis();
		onSelect(emoji);
		open = false;
		searchQuery = '';
	}

	// Get category keys for tabs (excluding 'recent' which we handle separately)
	const categoryKeys = Object.keys(EMOJI_CATEGORIES).filter(
		(key) => key !== 'recent'
	) as EmojiCategory[];
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		<Button
			variant="outline"
			class="h-9 w-9 rounded-md text-lg transition-all hover:border-primary {className}"
			aria-label="Select icon"
		>
			{value}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0" align="start">
		<div class="flex flex-col">
			<!-- Search input -->
			<div class="border-b p-3">
				<div class="relative">
					<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input bind:value={searchQuery} placeholder="Search emojis..." class="pl-9" autofocus />
				</div>
			</div>

			<!-- Category tabs -->
			{#if !searchQuery}
				<Tabs.Root bind:value={activeTab} class="w-full">
					<div class="border-b">
						<ScrollArea class="w-full">
							<Tabs.List class="inline-flex w-max gap-1 bg-transparent p-1">
								{#if recentEmojis.length > 0}
									<Tabs.Trigger
										value="recent"
										class="h-8 rounded-md px-2 text-sm data-[state=active]:bg-muted"
									>
										🕐
									</Tabs.Trigger>
								{/if}
								{#each categoryKeys as key (key)}
									<Tabs.Trigger
										value={key}
										class="h-8 rounded-md px-2 text-sm data-[state=active]:bg-muted"
									>
										{EMOJI_CATEGORIES[key].icon}
									</Tabs.Trigger>
								{/each}
							</Tabs.List>
						</ScrollArea>
					</div>

					<!-- Tab content with emoji grids -->
					<ScrollArea class="h-48">
						{#if recentEmojis.length > 0}
							<Tabs.Content value="recent" class="mt-0 p-2">
								<div class="grid grid-cols-6 gap-1">
									{#each recentEmojis as emoji (emoji)}
										<Button
											variant="ghost"
											class="h-10 w-10 rounded-md p-0 text-xl hover:bg-muted {value === emoji
												? 'bg-primary/10 ring-2 ring-primary'
												: ''}"
											onclick={() => handleEmojiSelect(emoji)}
										>
											{emoji}
										</Button>
									{/each}
								</div>
							</Tabs.Content>
						{/if}
						{#each categoryKeys as key (key)}
							<Tabs.Content value={key} class="mt-0 p-2">
								<div class="grid grid-cols-6 gap-1">
									{#each EMOJI_CATEGORIES[key].emojis as emoji (emoji)}
										<Button
											variant="ghost"
											class="h-10 w-10 rounded-md p-0 text-xl hover:bg-muted {value === emoji
												? 'bg-primary/10 ring-2 ring-primary'
												: ''}"
											onclick={() => handleEmojiSelect(emoji)}
										>
											{emoji}
										</Button>
									{/each}
								</div>
							</Tabs.Content>
						{/each}
					</ScrollArea>
				</Tabs.Root>
			{:else}
				<!-- Search results -->
				<ScrollArea class="h-48">
					<div class="p-2">
						{#if displayEmojis.length > 0}
							<div class="grid grid-cols-6 gap-1">
								{#each displayEmojis as emoji (emoji)}
									<Button
										variant="ghost"
										class="h-10 w-10 rounded-md p-0 text-xl hover:bg-muted {value === emoji
											? 'bg-primary/10 ring-2 ring-primary'
											: ''}"
										onclick={() => handleEmojiSelect(emoji)}
									>
										{emoji}
									</Button>
								{/each}
							</div>
						{:else}
							<p class="py-4 text-center text-sm text-muted-foreground">No emojis found</p>
						{/if}
					</div>
				</ScrollArea>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
