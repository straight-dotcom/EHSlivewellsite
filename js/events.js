/* ============================================
   EHS LiveWell — events.js
   Calendar + list view for wellness events
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const events = await loadData('events.json');

  let currentDate = new Date();
  let currentView = 'calendar';
  let activeCategory = 'all';

  const calendarGrid = document.getElementById('calendarGrid');
  const eventsList = document.getElementById('eventsList');
  const calendarView = document.getElementById('calendarView');
  const listView = document.getElementById('listView');
  const calendarTitle = document.getElementById('calendarTitle');

  // ---- View Toggle ----
  document.querySelectorAll('.view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      if (currentView === 'calendar') {
        calendarView.style.display = '';
        listView.style.display = 'none';
      } else {
        calendarView.style.display = 'none';
        listView.style.display = '';
      }
      renderAll();
    });
  });

  // ---- Month Navigation ----
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderAll();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAll();
  });

  // ---- Category Filters ----
  document.getElementById('categoryFilters').addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-btn')) return;
    document.querySelectorAll('#categoryFilters .filter-btn').forEach((b) => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.cat;
    renderAll();
  });

  // ---- Filter Events ----
  function getFilteredEvents() {
    if (activeCategory === 'all') return events;
    return events.filter((e) => e.category === activeCategory);
  }

  // ---- Render Calendar ----
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    const filtered = getFilteredEvents();

    let html = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach((d) => {
      html += `<div class="calendar-day-header">${d}</div>`;
    });

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      html += `<div class="calendar-day other-month"><span class="calendar-day-num">${day}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isToday = dateObj.toDateString() === today.toDateString();
      const dayEvents = filtered.filter((e) => {
        const d = new Date(e.startDate);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
      });

      html += `<div class="calendar-day${isToday ? ' today' : ''}">
        <span class="calendar-day-num">${day}</span>
        ${dayEvents.map((e) =>
          `<div class="calendar-event cat-${e.category.toLowerCase()}" title="${escapeHtml(e.title)}" data-id="${e.id}">${escapeHtml(e.title)}</div>`
        ).join('')}
      </div>`;
    }

    // Next month padding
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-day other-month"><span class="calendar-day-num">${i}</span></div>`;
    }

    calendarGrid.innerHTML = html;

    // Click handler for events
    calendarGrid.querySelectorAll('.calendar-event').forEach((el) => {
      el.addEventListener('click', () => {
        const evt = events.find((e) => e.id === el.dataset.id);
        if (evt) showEventModal(evt);
      });
    });
  }

  // ---- Render List ----
  function renderList() {
    const filtered = getFilteredEvents();
    const now = new Date();
    const upcoming = filtered
      .filter((e) => new Date(e.startDate) >= new Date(now.getFullYear(), now.getMonth(), 1))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (upcoming.length === 0) {
      eventsList.innerHTML = '<div class="empty-state"><h3>No events found</h3><p>Check back soon for new events.</p></div>';
      return;
    }

    eventsList.innerHTML = upcoming.map((evt) => {
      const d = new Date(evt.startDate);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const dayStr = d.getDate();
      const timeStr = formatTime(evt.startDate);
      const endTimeStr = evt.endDate ? formatTime(evt.endDate) : '';
      const catColor = `var(--cat-${evt.category.toLowerCase()})`;

      return `
        <div class="event-row">
          <div class="event-date-badge">
            <div class="month">${monthStr}</div>
            <div class="day">${dayStr}</div>
          </div>
          <div class="event-details">
            <h3>
              <span class="event-category-dot" style="background:${catColor}"></span>
              ${escapeHtml(evt.title)}
            </h3>
            <div class="event-time">${timeStr}${endTimeStr ? ' – ' + endTimeStr : ''} &middot; ${escapeHtml(evt.category)}</div>
            <p class="card-desc">${escapeHtml(evt.description || '')}</p>
          </div>
        </div>`;
    }).join('');
  }

  // ---- Event Modal ----
  function showEventModal(evt) {
    const d = new Date(evt.startDate);
    const dateStr = formatDate(evt.startDate);
    const timeStr = formatTime(evt.startDate);
    const endTimeStr = evt.endDate ? formatTime(evt.endDate) : '';

    openModal(`
      <span class="card-badge badge-${evt.category.toLowerCase()}">${escapeHtml(evt.category)}</span>
      <h2 style="margin: var(--space-sm) 0;">${escapeHtml(evt.title)}</h2>
      <p class="event-time" style="margin-bottom: var(--space-md);">
        ${dateStr} &middot; ${timeStr}${endTimeStr ? ' – ' + endTimeStr : ''}
      </p>
      <p>${escapeHtml(evt.description || '')}</p>
      ${evt.link ? `<a href="${escapeHtml(evt.link)}" class="btn btn-primary" target="_blank" rel="noopener" style="margin-top:var(--space-md);">More Info</a>` : ''}
    `);
  }

  // ---- Render All ----
  function renderAll() {
    renderCalendar();
    renderList();
  }

  renderAll();
});
