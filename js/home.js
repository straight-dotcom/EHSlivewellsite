/* ============================================
   EHS LiveWell — home.js
   Home page: snippets from each content category
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadAllData();

  renderUpcomingEvents(data.events);
  renderLatestRecommendations(data.recommendations);
  renderFeaturedProviders(data.providers);
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

function renderLatestRecommendations(recs) {
  const container = document.getElementById('homeRecommendations');
  if (!container) return;

  const latest = recs.slice(0, 3);
  if (latest.length === 0) {
    showEmpty(container, 'No recommendations yet');
    return;
  }

  container.innerHTML = '';
  latest.forEach((rec) => {
    container.appendChild(createCard(rec, 'recommendation'));
  });
}

function renderFeaturedProviders(providers) {
  const container = document.getElementById('homeProviders');
  if (!container) return;

  const featured = providers.slice(0, 3);
  if (featured.length === 0) {
    showEmpty(container, 'No providers listed yet');
    return;
  }

  container.innerHTML = '';
  featured.forEach((prov) => {
    const card = createCard(prov, 'provider');
    container.appendChild(card);
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
