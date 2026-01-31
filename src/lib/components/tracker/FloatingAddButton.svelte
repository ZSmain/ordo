<script lang="ts">
	import { CreateActivity, CreateCategory } from '$lib/components/tracker';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();

	let isExpanded = $state(false);
	let showCategoryForm = $state(false);
	let showActivityForm = $state(false);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function openCategoryForm() {
		showCategoryForm = true;
	}

	function openActivityForm() {
		showActivityForm = true;
	}

	function handleCategoryCreated() {
		// Collapse the floating button after successful creation
		isExpanded = false;
	}

	function handleActivityCreated() {
		// Collapse the floating button after successful creation
		isExpanded = false;
	}
</script>

<!-- Floating Add Button -->
<div class="fixed right-6 bottom-20 z-50 flex flex-col items-end gap-3">
	<!-- Expanded Action Buttons -->
	{#if isExpanded}
		<div class="flex animate-in flex-col gap-2 duration-200 slide-in-from-bottom-2">
			<Button
				variant="secondary"
				size="sm"
				class="whitespace-nowrap shadow-lg transition-shadow hover:shadow-xl"
				onclick={openCategoryForm}
			>
				<span class="mr-2">📁</span>
				Create Category
			</Button>
			<Button
				variant="secondary"
				size="sm"
				class="whitespace-nowrap shadow-lg transition-shadow hover:shadow-xl"
				onclick={openActivityForm}
			>
				<span class="mr-2">⚡</span>
				Create Activity
			</Button>
		</div>
	{/if}

	<!-- Main Add Button -->
	<Button
		size="lg"
		class="h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl {isExpanded
			? 'rotate-45'
			: ''}"
		onclick={toggleExpanded}
		aria-label={isExpanded ? 'Close menu' : 'Add new category or activity'}
		aria-expanded={isExpanded}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</svg>
	</Button>
</div>

<!-- Create Category Form -->
<CreateCategory bind:open={showCategoryForm} onCategoryCreated={handleCategoryCreated} {userId} />

<!-- Create Activity Form -->
<CreateActivity bind:open={showActivityForm} onActivityCreated={handleActivityCreated} {userId} />
