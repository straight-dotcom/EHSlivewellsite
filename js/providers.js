/* ============================================
   EHS LiveWell — providers.js
   Provider directory with search and specialty tags
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const providers = await loadData('providers.json');
  const grid = document.getElementById('providersGrid');
  const searchInput = document.getElementById('searchInput');

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
      showEmpty(grid, 'No providers found');
      return;
    }
    grid.innerHTML = '';
    items.forEach((prov) => {
      grid.appendChild(createProviderCard(prov));
    });
  }

  render(providers);

  // Search also includes specialties
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    if (!q) { render(providers); return; }
    const filtered = providers.filter((p) =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.specialties && p.specialties.some((s) => s.toLowerCase().includes(q)))
    );
    render(filtered);
  });
});
