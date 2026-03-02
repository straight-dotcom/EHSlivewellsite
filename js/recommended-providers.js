/* ============================================
   EHS LiveWell — recommended-providers.js
   Combined recommendations + providers with
   search and type filtering
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const [recommendations, providers] = await Promise.all([
    loadData('recommendations.json'),
    loadData('providers.json'),
  ]);

  // Tag each item with its type for filtering
  const allItems = [
    ...recommendations.map((r) => ({ ...r, _type: 'recommendation' })),
    ...providers.map((p) => ({ ...p, _type: 'provider' })),
  ];

  const grid = document.getElementById('combinedGrid');
  const searchInput = document.getElementById('searchInput');
  let activeFilter = 'all';

  function createProviderCard(prov) {
    const card = document.createElement('div');
    card.className = 'card provider-card';

    let specialtiesHtml = '';
    if (prov.specialties && prov.specialties.length > 0) {
      specialtiesHtml = `<div class="card-specialties">
        ${prov.specialties.map((s) => `<span class="specialty-tag">${escapeHtml(s)}</span>`).join('')}
      </div>`;
    }

    let linkHtml = '';
    if (prov.link) {
      linkHtml = `<a href="${escapeHtml(prov.link)}" class="card-link" target="_blank" rel="noopener">
        Visit website <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
      </a>`;
    }

    card.innerHTML = `
      <span class="card-badge badge-provider">Provider</span>
      <h3>${escapeHtml(prov.title)}</h3>
      ${specialtiesHtml}
      <p class="card-desc">${escapeHtml(prov.description || '')}</p>
      ${linkHtml}
    `;
    return card;
  }

  function render(items) {
    if (items.length === 0) {
      showEmpty(grid, 'No results found');
      return;
    }
    grid.innerHTML = '';
    items.forEach((item) => {
      if (item._type === 'provider') {
        grid.appendChild(createProviderCard(item));
      } else {
        grid.appendChild(createCard(item, 'recommendation'));
      }
    });
  }

  function applyFilters() {
    const q = searchInput.value.toLowerCase();
    let filtered = allItems;

    // Type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((item) => item._type === activeFilter);
    }

    // Search filter
    if (q) {
      filtered = filtered.filter((item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.specialties && item.specialties.some((s) => s.toLowerCase().includes(q)))
      );
    }

    render(filtered);
  }

  render(allItems);

  searchInput.addEventListener('input', applyFilters);

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });
});
