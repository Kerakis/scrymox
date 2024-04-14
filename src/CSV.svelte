<script>
  export let cards = [];
</script>

<table class="table-auto w-full mt-4 text-gray-200">
  <thead>
    <tr>
      <th>Count</th>
      <th>Name</th>
      <th>Edition</th>
      <th>Condition</th>
      <th>Language</th>
      <th>Foil</th>
      <th>Collector Number</th>
      <th>Alter</th>
      <th>Proxy</th>
      <th>Purchase Price</th>
    </tr>
  </thead>
  <tbody>
    {#each cards as card (card.id)}
      <tr>
        <td>{card.count}</td>
        <td>{card.name}</td>
        <td>{card.set}</td>
        <td>{card.condition}</td>
        <td>{card.language}</td>
        <td>{card.selectedFinish}</td>
        <td>{card.collector_number}</td>
        <td>{card.alter}</td>
        <td>{card.proxy}</td>
        <td>{card.price}</td>
      </tr>
    {/each}
  </tbody>
</table>
