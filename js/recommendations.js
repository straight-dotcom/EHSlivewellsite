/* ============================================
   EHS LiveWell — recommendations.js
   Filterable recommendations cards
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const recs = await loadData('recommendations.json');
  const grid = document.getElementById('recommendationsGrid');
  const searchInput = document.getElementById('searchInput');

  function render(items) {
    if (items.length === 0) {
      showEmpty(grid, 'No recommendations found');
      return;
    }
    grid.innerHTML = '';
    items.forEach((rec) => {
      grid.appendChild(createCard(rec, 'recommendation'));
    });
  }

  render(recs);

  searchInput.addEventListener('input', () => {
    render(filterItems(recs, searchInput.value));
  });
});
