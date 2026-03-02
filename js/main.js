/* ============================================
   EHS LiveWell — main.js
   Shared navigation, utilities, data loading
   ============================================ */

// ---- Configuration ----
const CONFIG = {
  dataBasePath: 'data/',
  formUrl: '#', // Replace with your Google Form URL
  siteTitle: 'EHS LiveWell',
};

// ---- Mobile Navigation Toggle ----
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Mark active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ---- Data Loading ----
async function loadData(filename) {
  try {
    const resp = await fetch(`${CONFIG.dataBasePath}${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.warn(`Could not load ${filename}:`, err.message);
    return [];
  }
}

async function loadAllData() {
  const [events, recommendations, providers, resources] = await Promise.all([
    loadData('events.json'),
    loadData('recommendations.json'),
    loadData('providers.json'),
    loadData('resources.json'),
  ]);
  return { events, recommendations, providers, resources };
}

// ---- Card Rendering Helpers ----
function createCard(item, type) {
  const card = document.createElement('div');
  card.className = 'card';

  const badgeClass = `badge-${type}`;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  let metaHtml = '';
  if (item.date || item.startDate) {
    const dateStr = item.startDate || item.date;
    metaHtml = `
      <div class="card-meta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${formatDate(dateStr)}</span>
      </div>`;
  }

  let linkHtml = '';
  if (item.link) {
    linkHtml = `<a href="${escapeHtml(item.link)}" class="card-link" target="_blank" rel="noopener">
      Learn more <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
    </a>`;
  }

  let filesHtml = '';
  if (item.fileLinks && item.fileLinks.length > 0) {
    filesHtml = item.fileLinks.map((f) =>
      `<a href="${escapeHtml(f.url)}" class="card-link" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${escapeHtml(f.name || 'Attachment')}
      </a>`
    ).join('');
  }

  let categoryHtml = '';
  if (item.category) {
    const catClass = `badge-${item.category.toLowerCase()}`;
    categoryHtml = `<span class="card-badge ${catClass}">${escapeHtml(item.category)}</span>`;
  }

  card.innerHTML = `
    ${categoryHtml || `<span class="card-badge ${badgeClass}">${typeLabel}</span>`}
    <h3>${escapeHtml(item.title)}</h3>
    <p class="card-desc">${escapeHtml(item.description || '')}</p>
    ${linkHtml}
    ${filesHtml}
    ${metaHtml}
  `;
  return card;
}

// ---- Utility Functions ----
function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function showLoading(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showEmpty(container, message) {
  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
      </svg>
      <h3>${message || 'No items found'}</h3>
      <p>Check back soon for updates.</p>
    </div>`;
}

function filterItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
  );
}

// ---- Modal ----
function openModal(contentHtml) {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal"><button class="modal-close" aria-label="Close">&times;</button><div class="modal-body"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('modal-close')) {
        overlay.classList.remove('open');
      }
    });
  }
  overlay.querySelector('.modal-body').innerHTML = contentHtml;
  overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', initNav);
