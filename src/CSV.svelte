<script>
	import Card from './Card.svelte';
	import Modal from './Modal.svelte';
	import { getDisplayFinish, getFinishPrice } from './lib/finishes.js';
	import { buildCsv } from './lib/export.js';

	/**
	 * @type {{
	 *   cards?: import('./types').Card[];
	 *   onupdate?: (cards: import('./types').Card[]) => void;
	 *   onremove?: (id: string) => void;
	 * }}
	 */
	let { cards = [], onupdate, onremove } = $props();
	/** @type {HTMLInputElement | undefined} */
	let countInput = $state();
	let showCountModal = $state(false);
	let showConditionModal = $state(false);
	let showLanguageModal = $state(false);
	let showFinishModal = $state(false);
	let showAlterModal = $state(false);
	let showProxyModal = $state(false);
	let showPriceModal = $state(false);

	const languages = {
		EN: 'English',
		ES: 'Spanish',
		FR: 'French',
		DE: 'German',
		IT: 'Italian',
		PT: 'Portuguese',
		JA: 'Japanese',
		KO: 'Korean',
		RU: 'Russian',
		ZHS: 'Simplified Chinese',
		ZHT: 'Traditional Chinese',
		HE: 'Hebrew',
		LA: 'Latin',
		GRC: 'Ancient Greek',
		AR: 'Arabic',
		SA: 'Sanskrit',
		PH: 'Phyrexian'
	};

	const conditions = {
		M: 'Mint',
		NM: 'Near Mint',
		LP: 'Lightly Played',
		MP: 'Played',
		HP: 'Heavily Played',
		DM: 'Damaged'
	};

	/**
	 * Returns a finish-updated copy of a card, refreshing the marker and (unless
	 * the price was set manually) the auto price.
	 * @param {import('./types').Card} card
	 * @param {string} finish
	 * @returns {import('./types').Card}
	 */
	const withFinish = (card, finish) => {
		const next = { ...card, selectedFinish: finish, displayFinish: getDisplayFinish(finish) };
		if (!next.priceManuallySet) next.displayedPrice = getFinishPrice(next.prices, finish);
		return next;
	};

	/** Replaces the card at `index` with `{ ...card, ...patch }`. */
	const updateAt = (
		/** @type {number} */ index,
		/** @type {Partial<import('./types').Card>} */ patch
	) => onupdate?.(cards.map((card, i) => (i === index ? { ...card, ...patch } : card)));

	/** Applies `patch` to every card. */
	const updateAll = (/** @type {Partial<import('./types').Card>} */ patch) =>
		onupdate?.(cards.map((card) => ({ ...card, ...patch })));

	const updateCount = (/** @type {number} */ index, /** @type {string} */ value) => {
		const count = parseInt(value);
		if (count >= 1 && count <= 99) updateAt(index, { count });
	};

	const changeAllCounts = () => {
		if (countInput) {
			const count = parseInt(countInput.value);
			if (count >= 1 && count <= 99) updateAll({ count });
		}
		showCountModal = false;
	};

	const changeFinish = (/** @type {number} */ index, /** @type {string} */ finish) =>
		onupdate?.(cards.map((card, i) => (i === index ? withFinish(card, finish) : card)));

	const changeAllFinishes = (/** @type {string} */ finish) =>
		onupdate?.(cards.map((card) => withFinish(card, finish)));

	const updatePrice = (/** @type {number} */ index, /** @type {string} */ value) => {
		if (value === '') {
			updateAt(index, { price: undefined, priceManuallySet: false });
		} else {
			updateAt(index, { price: parseFloat(value), priceManuallySet: true });
		}
	};

	const toggleStatus = (/** @type {number} */ index, /** @type {'alter' | 'proxy'} */ field) =>
		updateAt(index, { [field]: !cards[index][field] });

	const handleCardUpdate = (/** @type {import('./types').Card} */ updatedCard) =>
		onupdate?.(cards.map((card) => (card.id === updatedCard.id ? updatedCard : card)));

	const downloadCSV = () => {
		const blob = new Blob([buildCsv(cards)], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'cards.csv';
		link.click();
		URL.revokeObjectURL(url);
	};
</script>

<div class="cards mt-4 h-64 overflow-auto rounded-md border border-gray-500 text-gray-200">
	<table class="w-full table-auto text-gray-200">
		<thead>
			<tr class="border-b border-gray-500">
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showCountModal = !showCountModal)}
						class="cursor-pointer font-semibold">Count</button
					>
					<Modal bind:show={showCountModal} onclose={() => (showCountModal = false)}>
						<input
							bind:this={countInput}
							type="number"
							min="1"
							max="99"
							placeholder="Count"
							onkeydown={(e) => {
								if (e.key === 'Enter') changeAllCounts();
							}}
							class="rounded-sm px-2 py-1 text-gray-200"
						/>
						<button onclick={changeAllCounts} class="ml-2 rounded-sm bg-indigo-600 px-2 py-1">
							Apply to All
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">Name</th>
				<th class="px-2 py-1 text-left">Edition</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showConditionModal = !showConditionModal)}
						class="cursor-pointer font-semibold">Condition</button
					>
					<Modal bind:show={showConditionModal} onclose={() => (showConditionModal = false)}>
						<select
							onchange={(e) => updateAll({ condition: e.currentTarget.value })}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="">-- Select --</option>
							{#each Object.entries(conditions) as [key, value] (key)}
								<option value={key}>{value}</option>
							{/each}
						</select>
						<button
							onclick={() => (showConditionModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showLanguageModal = !showLanguageModal)}
						class="cursor-pointer font-semibold">Language</button
					>
					<Modal bind:show={showLanguageModal} onclose={() => (showLanguageModal = false)}>
						<select
							onchange={(e) => updateAll({ language: e.currentTarget.value })}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="">-- Select --</option>
							{#each Object.entries(languages) as [key, value] (key)}
								<option value={key}>{value}</option>
							{/each}
						</select>
						<button
							onclick={() => (showLanguageModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showFinishModal = !showFinishModal)}
						class="cursor-pointer font-semibold">Finish</button
					>
					<Modal bind:show={showFinishModal} onclose={() => (showFinishModal = false)}>
						<select
							onchange={(e) => changeAllFinishes(e.currentTarget.value)}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="">Non-foil</option>
							<option value="foil">Foil</option>
							<option value="etched">Etched</option>
						</select>
						<button
							onclick={() => (showFinishModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showAlterModal = !showAlterModal)}
						class="cursor-pointer font-semibold">Alter</button
					>
					<Modal bind:show={showAlterModal} onclose={() => (showAlterModal = false)}>
						<select
							onchange={(e) => updateAll({ alter: e.currentTarget.value === 'true' })}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="false">No</option>
							<option value="true">Yes</option>
						</select>
						<button
							onclick={() => (showAlterModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showProxyModal = !showProxyModal)}
						class="cursor-pointer font-semibold">Proxy</button
					>
					<Modal bind:show={showProxyModal} onclose={() => (showProxyModal = false)}>
						<select
							onchange={(e) => updateAll({ proxy: e.currentTarget.value === 'true' })}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="false">No</option>
							<option value="true">Yes</option>
						</select>
						<button
							onclick={() => (showProxyModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={() => (showPriceModal = !showPriceModal)}
						class="cursor-pointer font-semibold">Price</button
					>
					<Modal bind:show={showPriceModal} onclose={() => (showPriceModal = false)}>
						<p class="mb-2 text-sm">
							Prices default to the Scryfall price for each card's finish. Type a value in any row
							to override it; choose Auto to clear all overrides.
						</p>
						<select
							onchange={(e) => {
								if (e.currentTarget.value === 'auto')
									updateAll({ price: undefined, priceManuallySet: false });
							}}
							class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
						>
							<option value="">-- Select --</option>
							<option value="auto">Auto (Scryfall price)</option>
						</select>
						<button
							onclick={() => (showPriceModal = false)}
							class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
						>
							Done
						</button>
					</Modal>
				</th>
				{#if onremove}
					<th class="px-2 py-1 text-left"><span class="sr-only">Remove</span></th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each cards as card, index (card.id)}
				<tr class="border-b border-gray-600">
					<td class="px-2 py-1">
						<input
							type="number"
							min="1"
							max="99"
							value={card.count}
							onchange={(e) => updateCount(index, e.currentTarget.value)}
							class="w-16 rounded-sm px-1 py-1 text-gray-200"
						/>
					</td>
					<td class="px-2 py-1">
						<Card {card} displayMode="CSV" onupdate={handleCardUpdate} />
					</td>
					<td class="px-2 py-1">{card.set.toUpperCase()}</td>
					<td class="px-2 py-1">
						<select
							value={card.condition}
							onchange={(e) => updateAt(index, { condition: e.currentTarget.value })}
							class="rounded-sm bg-indigo-700 px-1 py-1 text-gray-200"
						>
							{#each Object.entries(conditions) as [key, value] (key)}
								<option value={key}>{value}</option>
							{/each}
						</select>
					</td>
					<td class="px-2 py-1">
						<select
							value={card.language}
							onchange={(e) => updateAt(index, { language: e.currentTarget.value })}
							class="rounded-sm bg-indigo-700 px-1 py-1 text-gray-200"
						>
							{#each Object.entries(languages) as [key, value] (key)}
								<option value={key}>{value}</option>
							{/each}
						</select>
					</td>
					<td class="px-2 py-1">
						<select
							value={card.selectedFinish}
							onchange={(e) => changeFinish(index, e.currentTarget.value)}
							class="rounded-sm bg-indigo-700 px-1 py-1 text-gray-200"
						>
							<option value="">Non-foil</option>
							{#if card.finishes.includes('foil')}
								<option value="foil">Foil</option>
							{/if}
							{#if card.finishes.includes('etched')}
								<option value="etched">Etched</option>
							{/if}
						</select>
					</td>
					<td class="px-2 py-1">
						<input
							type="checkbox"
							checked={card.alter}
							onchange={() => toggleStatus(index, 'alter')}
							class="rounded-sm"
						/>
					</td>
					<td class="px-2 py-1">
						<input
							type="checkbox"
							checked={card.proxy}
							onchange={() => toggleStatus(index, 'proxy')}
							class="rounded-sm"
						/>
					</td>
					<td class="px-2 py-1">
						<input
							type="number"
							step="0.01"
							min="0"
							value={card.priceManuallySet ? (card.price ?? '') : ''}
							placeholder={card.displayedPrice ?? 'Auto'}
							onchange={(e) => updatePrice(index, e.currentTarget.value)}
							class="w-20 rounded-sm px-1 py-1 text-gray-200"
						/>
					</td>
					{#if onremove}
						<td class="px-2 py-1">
							<button
								type="button"
								onclick={() => onremove?.(card.id)}
								aria-label={`Remove ${card.name}`}
								class="rounded-sm px-1 text-gray-400 hover:text-red-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
							>
								✕
							</button>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<button
	onclick={downloadCSV}
	class="mt-4 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
>
	Download CSV
</button>
