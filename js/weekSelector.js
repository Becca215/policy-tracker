// weekSelector.js
// Adds a week selector UI and logic to display the week (Mon-Sun) based on selected Monday

export function setupWeekSelector(containerId = 'mainContent') {
  // Show today's date at the top
  const todayDate = new Date();
  const todayDiv = document.createElement('div');
  todayDiv.className = 'small text-muted mb-1';
  todayDiv.textContent = `Today: ${todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' })}`;
  // Helper: set input min/max/step so only Mondays are selectable
  // HTML date input does not support day-of-week restriction, so we use JS validation
  const container = document.getElementById(containerId);
  if (!container) return;

  // Create wrapper
  const weekDiv = document.createElement('div');
  weekDiv.className = 'd-flex flex-column align-items-center mb-3';

  // Label
  const label = document.createElement('label');
  label.className = 'form-label fw-semibold mb-1';
  label.textContent = 'Select Week (Monday Start)';
  label.setAttribute('for', 'weekStartInput');

  // Date input (type=date, restrict to Mondays)
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'form-control form-control-sm';
  input.style.maxWidth = '180px';
  input.id = 'weekStartInput';

  // Helper text to clarify Monday-only selection
  const helpText = document.createElement('div');
  helpText.className = 'form-text text-muted mb-2';
  helpText.textContent = 'Only Mondays can be selected.';

  // Inline warning for non-Monday selection
  const mondayWarning = document.createElement('div');
  mondayWarning.className = 'alert alert-warning py-1 px-2 mb-2 d-none';
  mondayWarning.style.fontSize = '0.95em';
  mondayWarning.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Please select a Monday. Only Mondays are allowed as the start of the week.';

  // Helper: get this week's Monday
  function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    // Always go back to the most recent Monday (including today if Monday)
    const monday = new Date(d);
    const diff = d.getDate() - ((day + 6) % 7);
    monday.setDate(diff);
    return monday;
  }

  // Helper: format date as e.g. Mon 7/15
  function formatDay(date, offset) {
    // Always display as Mon 7/21, Tue 7/22, ... with week starting on Monday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${days[offset]} ${date.getMonth() + 1}/${date.getDate()}`;
  }

  // Week days display
  const daysRow = document.createElement('div');
  daysRow.className = 'd-flex gap-2 mt-2';

  // Restore week from localStorage if available, else use current week's Monday
  const today = new Date();
  let storedWeek = localStorage.getItem('selectedWeekStart');
  let weekToUse;
  if (storedWeek && /^\d{4}-\d{2}-\d{2}$/.test(storedWeek)) {
    weekToUse = storedWeek;
  } else {
    const thisMonday = getMonday(today);
    weekToUse = thisMonday.toISOString().slice(0, 10);
  }
  input.value = weekToUse;

  function renderWeek(startDateStr) {
    daysRow.innerHTML = '';
    const [year, month, day] = startDateStr.split('-').map(Number);
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    for (let i = 0; i < 7; i++) {
      // Always start from the selected Monday, add i days
      const d = new Date(year, month - 1, day + i);
      const dYMD = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dayDiv = document.createElement('div');
      dayDiv.className = 'border rounded px-2 py-1 bg-light text-center d-flex flex-column align-items-center justify-content-center';
      if (dYMD === todayYMD) {
        dayDiv.classList.add('bg-warning', 'text-dark', 'border', 'border-2', 'border-primary', 'shadow-sm');
      }
      dayDiv.style.minWidth = '80px';
      // Split day and date into two lines for all days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayLabel = document.createElement('div');
      dayLabel.textContent = days[i];
      dayLabel.className = 'fw-bold';
      const dateLabel = document.createElement('div');
      dateLabel.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
      dayDiv.appendChild(dayLabel);
      dayDiv.appendChild(dateLabel);
      daysRow.appendChild(dayDiv);
    }
  }

  // Only allow Mondays to be picked (block non-Mondays in UI)
  input.addEventListener('input', () => {
    // Parse input as local date (YYYY-MM-DD)
    function getLocalDay(val) {
      if (!val) return NaN;
      const [year, month, day] = val.split('-').map(Number);
      return new Date(year, month - 1, day).getDay();
    }
    const dayOfWeek = getLocalDay(input.value);
    if (input.value && dayOfWeek !== 1) {
      input.setCustomValidity('Please select a Monday.');
      input.reportValidity();
      input.classList.add('is-invalid');
      input.value = '';
      daysRow.innerHTML = '';
      localStorage.removeItem('selectedWeekStart');
      // Show only the inline warning
      mondayWarning.classList.remove('d-none');
    } else if (input.value) {
      input.setCustomValidity('');
      input.classList.remove('is-invalid');
      mondayWarning.classList.add('d-none');
      renderWeek(input.value);
      localStorage.setItem('selectedWeekStart', input.value);
    } else {
      input.classList.remove('is-invalid');
      mondayWarning.classList.add('d-none');
      localStorage.removeItem('selectedWeekStart');
    }
  });

  // Initial render
  renderWeek(input.value);

  weekDiv.appendChild(todayDiv);
  weekDiv.appendChild(label);
  weekDiv.appendChild(helpText);
  weekDiv.appendChild(mondayWarning);
  weekDiv.appendChild(input);
  weekDiv.appendChild(daysRow);

  // Insert at the top of mainContent
  container.insertBefore(weekDiv, container.firstChild);
}
