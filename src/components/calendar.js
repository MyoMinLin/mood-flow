import { el } from '../utils/dom.js';
import { today, daysInMonth, firstDayOfMonth, monthName, dayNames, format } from '../utils/date.js';
import { getEntryDatesForMonth } from '../services/diary.js';
import { emit } from '../utils/events.js';

export function Calendar() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let selectedDate = today();
  let entryDates = [];

  const container = el('div', { className: 'calendar' });

  async function refresh() {
    entryDates = await getEntryDatesForMonth(year, month);
    render();
  }

  function render() {
    container.innerHTML = '';

    // Header
    const header = el('div', { className: 'calendar-header' }, [
      el('div', { className: 'calendar-nav' }, [
        el('button', { textContent: '‹', onClick: () => { month--; if (month < 0) { month = 11; year--; } refresh(); } }),
      ]),
      el('h2', { textContent: `${monthName(month)} ${year}` }),
      el('div', { className: 'calendar-nav' }, [
        el('button', { textContent: '›', onClick: () => { month++; if (month > 11) { month = 0; year++; } refresh(); } }),
      ]),
    ]);
    container.appendChild(header);

    // Grid
    const grid = el('div', { className: 'calendar-grid' });

    // Day names
    for (const name of dayNames()) {
      grid.appendChild(el('div', { className: 'calendar-day-name', textContent: name }));
    }

    // Days
    const firstDay = firstDayOfMonth(year, month);
    const totalDays = daysInMonth(year, month);
    const todayStr = today();

    // Previous month padding
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const d = el('div', { className: 'calendar-day other-month', textContent: String(day) });
      grid.appendChild(d);
    }

    // Current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const classes = ['calendar-day'];
      if (dateStr === todayStr) classes.push('today');
      if (dateStr === selectedDate) classes.push('selected');

      const dayEl = el('div', { className: classes.join(' '), textContent: String(day) });

      if (entryDates.includes(dateStr)) {
        dayEl.appendChild(el('div', { className: 'dot' }));
      }

      dayEl.addEventListener('click', () => {
        selectedDate = dateStr;
        emit('date:selected', { date: dateStr });
        render();
      });

      grid.appendChild(dayEl);
    }

    // Next month padding
    const totalCells = firstDay + totalDays;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      grid.appendChild(el('div', { className: 'calendar-day other-month', textContent: String(i) }));
    }

    container.appendChild(grid);
    emit('month:changed', { year, month });
  }

  refresh();

  return {
    element: container,
    refresh,
    getSelectedDate: () => selectedDate
  };
}
