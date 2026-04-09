<script>
	import { onMount, onDestroy } from 'svelte';
	import Card from './Card.svelte';

	let { cards = [], onupdate } = $props();
	let countInput = $state();
	let showCountModal = $state(false);
	let showConditionModal = $state(false);
	let showLanguageModal = $state(false);
	let showFinishModal = $state(false);
	let showAlterModal = $state(false);
	let showProxyModal = $state(false);
	let showPriceModal = $state(false);
	let availableFinishes = $state([]);

	$effect(() => {
		availableFinishes = [...new Set(cards.flatMap((card) => card.finishes))];
	});

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('click', handleClickOutside);
	});

	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			showCountModal = false;
			showConditionModal = false;
			showLanguageModal = false;
			showFinishModal = false;
			showAlterModal = false;
			showProxyModal = false;
			showPriceModal = false;
		}
		if (event.key === 'Enter' && showCountModal) {
			changeAllCounts();
		}
	};

	const handleClickOutside = (event) => {
		if (event.target.closest('.modal') === null) {
			showCountModal = false;
			showConditionModal = false;
			showLanguageModal = false;
			showFinishModal = false;
			showAlterModal = false;
			showProxyModal = false;
			showPriceModal = false;
		}
	};

	const toggleModal = (modalName) => (event) => {
		event.stopPropagation();
		if (modalName === 'count') showCountModal = !showCountModal;
		if (modalName === 'condition') showConditionModal = !showConditionModal;
		if (modalName === 'language') showLanguageModal = !showLanguageModal;
		if (modalName === 'finish') showFinishModal = !showFinishModal;
		if (modalName === 'alter') showAlterModal = !showAlterModal;
		if (modalName === 'proxy') showProxyModal = !showProxyModal;
		if (modalName === 'price') showPriceModal = !showPriceModal;
	};

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

	const finishes = ['nonfoil', 'foil', 'etched'];

	const updateCard = (index, field, eventOrValue) => {
		let updatedCards = [...cards];
		if (field === 'count') {
			const newCount = parseInt(eventOrValue);
			if (newCount >= 1 && newCount <= 99) {
				updatedCards[index][field] = newCount;
			}
		} else if (eventOrValue instanceof Event) {
			const target = eventOrValue.currentTarget;
			if (target && 'value' in target) {
				updatedCards[index][field] = target.value;
			}
		} else {
			updatedCards[index][field] = eventOrValue;
		}
		if (onupdate) {
			onupdate(updatedCards);
		}
	};

	const changeAllCounts = () => {
		let updatedCards = [...cards];
		const newCount = parseInt(countInput.value);
		if (newCount >= 1 && newCount <= 99) {
			updatedCards.forEach((card) => {
				card.count = newCount;
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
		showCountModal = false;
	};

	const changeAllLanguages = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			updatedCards.forEach((card) => {
				card.language = target.value;
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeAllConditions = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			updatedCards.forEach((card) => {
				card.condition = target.value;
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeAllFinishes = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			const selectedFinish = target.value;
			updatedCards.forEach((card) => {
				card.selectedFinish = selectedFinish;
				if (selectedFinish === 'foil') {
					card.displayFinish = '*F*';
				} else if (selectedFinish === 'etched') {
					card.displayFinish = '*E*';
				} else {
					card.displayFinish = '';
				}
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeFinish = (index, event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			const selectedFinish = target.value;
			updatedCards[index].selectedFinish = selectedFinish;
			if (selectedFinish === 'foil') {
				updatedCards[index].displayFinish = '*F*';
			} else if (selectedFinish === 'etched') {
				updatedCards[index].displayFinish = '*E*';
			} else {
				updatedCards[index].displayFinish = '';
			}
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeAllProxies = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			const isProxy = target.value === 'true';
			updatedCards.forEach((card) => {
				card.proxy = isProxy;
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeAllAlters = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			const isAlter = target.value === 'true';
			updatedCards.forEach((card) => {
				card.alter = isAlter;
			});
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const updatePrice = (index, event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			updatedCards[index].price = parseFloat(target.value);
			updatedCards[index].priceManuallySet = true;
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const changeAllPrices = (event) => {
		let updatedCards = [...cards];
		const target = event.currentTarget;
		if (target && 'value' in target) {
			const priceType = target.value;
			if (priceType === 'auto') {
				updatedCards.forEach((card) => {
					card.priceManuallySet = false;
				});
			}
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const toggleStatus = (index, field) => {
		let updatedCards = [...cards];
		updatedCards[index][field] = !updatedCards[index][field];
		if (onupdate) {
			onupdate(updatedCards);
		}
	};

	// Handle card updates from the Card component in CSV mode
	const handleCardUpdate = (updatedCard) => {
		let updatedCards = [...cards];
		const cardIndex = updatedCards.findIndex((c) => c.id === updatedCard.id);
		if (cardIndex !== -1) {
			updatedCards[cardIndex] = updatedCard;
			if (onupdate) {
				onupdate(updatedCards);
			}
		}
	};

	const downloadCSV = () => {
		const csvContent = [
			[
				'Count',
				'Name',
				'Edition',
				'Collector Number',
				'Condition',
				'Language',
				'Foil',
				'Alter',
				'Proxy',
				'Price'
			].join(','),
			...cards.map((card) =>
				[
					card.count,
					`"${card.name}"`,
					card.set.toUpperCase(),
					card.collector_number,
					card.condition,
					card.language,
					card.selectedFinish === 'foil'
						? 'foil'
						: card.selectedFinish === 'etched'
							? 'etched'
							: '',
					card.alter ? 'Yes' : '',
					card.proxy ? 'Yes' : '',
					card.price || ''
				].join(',')
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'cards.csv';
		link.click();
	};
</script>

<div class="cards mt-4 h-64 overflow-auto rounded-md border border-gray-500 text-gray-200">
	<table class="w-full table-auto text-gray-200">
		<thead>
			<tr class="border-b border-gray-500">
				<th class="px-2 py-1 text-left">
					<button type="button" onclick={toggleModal('count')} class="cursor-pointer font-semibold"
						>Count</button
					>
					{#if showCountModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showCountModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showCountModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<input
									bind:this={countInput}
									type="number"
									min="1"
									max="99"
									placeholder="Count"
									class="rounded-sm px-2 py-1 text-gray-200"
								/>
								<button onclick={changeAllCounts} class="ml-2 rounded-sm bg-indigo-600 px-2 py-1">
									Apply to All
								</button>
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">Name</th>
				<th class="px-2 py-1 text-left">Edition</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={toggleModal('condition')}
						class="cursor-pointer font-semibold">Condition</button
					>
					{#if showConditionModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showConditionModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showConditionModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllConditions}
									class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
								>
									<option value="">-- Select --</option>
									{#each Object.entries(conditions) as [key, value]}
										<option value={key}>{value}</option>
									{/each}
								</select>
								<button
									onclick={() => (showConditionModal = false)}
									class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">
					<button
						type="button"
						onclick={toggleModal('language')}
						class="cursor-pointer font-semibold">Language</button
					>
					{#if showLanguageModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showLanguageModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showLanguageModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllLanguages}
									class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
								>
									<option value="">-- Select --</option>
									{#each Object.entries(languages) as [key, value]}
										<option value={key}>{value}</option>
									{/each}
								</select>
								<button
									onclick={() => (showLanguageModal = false)}
									class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">
					<button type="button" onclick={toggleModal('finish')} class="cursor-pointer font-semibold"
						>Finish</button
					>
					{#if showFinishModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showFinishModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showFinishModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllFinishes}
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
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">
					<button type="button" onclick={toggleModal('alter')} class="cursor-pointer font-semibold"
						>Alter</button
					>
					{#if showAlterModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showAlterModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showAlterModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllAlters}
									class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
								>
									<option value="">-- Select --</option>
									<option value="false">No</option>
									<option value="true">Yes</option>
								</select>
								<button
									onclick={() => (showAlterModal = false)}
									class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">
					<button type="button" onclick={toggleModal('proxy')} class="cursor-pointer font-semibold"
						>Proxy</button
					>
					{#if showProxyModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showProxyModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showProxyModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllProxies}
									class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
								>
									<option value="">-- Select --</option>
									<option value="false">No</option>
									<option value="true">Yes</option>
								</select>
								<button
									onclick={() => (showProxyModal = false)}
									class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</th>
				<th class="px-2 py-1 text-left">
					<button type="button" onclick={toggleModal('price')} class="cursor-pointer font-semibold"
						>Price</button
					>
					{#if showPriceModal}
						<div
							class="bg-opacity-50 modal fixed inset-0 z-50 flex items-center justify-center bg-black"
							onclick={(e) => {
								if (e.target === e.currentTarget) showPriceModal = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') showPriceModal = false;
							}}
							role="button"
							tabindex="0"
						>
							<div class="rounded-lg bg-indigo-800 p-4 text-gray-200" role="document">
								<select
									onchange={changeAllPrices}
									class="rounded-sm bg-indigo-700 px-2 py-1 text-gray-200"
								>
									<option value="auto">Auto</option>
								</select>
								<button
									onclick={() => (showPriceModal = false)}
									class="ml-2 rounded-sm bg-indigo-600 px-2 py-1"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</th>
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
							onchange={(e) => updateCard(index, 'count', e.currentTarget.value)}
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
							onchange={(e) => updateCard(index, 'condition', e)}
							class="rounded-sm bg-indigo-700 px-1 py-1 text-gray-200"
						>
							{#each Object.entries(conditions) as [key, value]}
								<option value={key}>{value}</option>
							{/each}
						</select>
					</td>
					<td class="px-2 py-1">
						<select
							value={card.language}
							onchange={(e) => updateCard(index, 'language', e)}
							class="rounded-sm bg-indigo-700 px-1 py-1 text-gray-200"
						>
							{#each Object.entries(languages) as [key, value]}
								<option value={key}>{value}</option>
							{/each}
						</select>
					</td>
					<td class="px-2 py-1">
						<select
							value={card.selectedFinish}
							onchange={(e) => changeFinish(index, e)}
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
							value={card.price || ''}
							onchange={(e) => updatePrice(index, e)}
							class="w-20 rounded-sm px-1 py-1 text-gray-200"
							placeholder="Auto"
						/>
					</td>
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
