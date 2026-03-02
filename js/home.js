/* ============================================
   EHS LiveWell — home.js
   Home page: snippets from each content category
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadAllData();

  renderUpcomingEvents(data.events);
  renderRecommendedProviders(data.recommendations, data.providers);
  renderLatestResources(data.resources);
  renderAnnouncement(data.events);
});

function renderAnnouncement(events) {
  const banner = document.getElementById('announcementBanner');
  const text = document.getElementById('announcementText');
  if (!banner || !text) return;

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (upcoming.length === 0) return;

  const next = upcoming[0];
  const dateStr = formatDate(next.startDate);
  const timeStr = formatTime(next.startDate);
  text.innerHTML = `<strong>Next Event:</strong> ${escapeHtml(next.title)} — ${dateStr}${timeStr ? ' at ' + timeStr : ''}`;
  banner.style.display = 'flex';
}

function renderUpcomingEvents(events) {
  const container = document.getElementById('homeEvents');
  if (!container) return;

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3);

  if (upcoming.length === 0) {
    showEmpty(container, 'No upcoming events');
    return;
  }

  container.innerHTML = '';
  upcoming.forEach((evt) => {
    const card = createCard(evt, 'event');
    container.appendChild(card);
  });
}

function renderRecommendedProviders(recs, providers) {
  const container = document.getElementById('homeRecommendedProviders');
  if (!container) return;

  // Interleave recommendations and providers, take up to 3
  const combined = [];
  const maxRecs = recs.slice(0, 2);
  const maxProvs = providers.slice(0, 2);
  maxRecs.forEach((r) => combined.push({ item: r, type: 'recommendation' }));
  maxProvs.forEach((p) => combined.push({ item: p, type: 'provider' }));
  const items = combined.slice(0, 3);

  if (items.length === 0) {
    showEmpty(container, 'No recommendations or providers yet');
    return;
  }

  container.innerHTML = '';
  items.forEach(({ item, type }) => {
    container.appendChild(createCard(item, type));
  });
}

function renderLatestResources(resources) {
  const container = document.getElementById('homeResources');
  if (!container) return;

  const latest = resources.slice(0, 3);
  if (latest.length === 0) {
    showEmpty(container, 'No resources yet');
    return;
  }

  container.innerHTML = '';
  latest.forEach((res) => {
    container.appendChild(createCard(res, 'resource'));
  });
}
