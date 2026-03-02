/* ============================================
   EHS LiveWell — resources.js
   Searchable wellness resources with file links
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const resources = await loadData('resources.json');
  const grid = document.getElementById('resourcesGrid');
  const searchInput = document.getElementById('searchInput');

  function render(items) {
    if (items.length === 0) {
      showEmpty(grid, 'No resources found');
      return;
    }
    grid.innerHTML = '';
    items.forEach((res) => {
      grid.appendChild(createCard(res, 'resource'));
    });
  }

  render(resources);

  searchInput.addEventListener('input', () => {
    render(filterItems(resources, searchInput.value));
  });
});
