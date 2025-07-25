// --- Cancelled Clients Modal Logic (appended, does not affect main view) ---
const cancelledWeekInput = document.getElementById('cancelledWeekInput');
const cancelledList = document.getElementById('cancelledList');
const viewCancelledBtn = document.getElementById('viewCancelledBtn');
const cancelledModalLabel = document.getElementById('cancelledModalLabel');

if (cancelledWeekInput && cancelledList && viewCancelledBtn) {
  // Set default week to current week when modal opens
  viewCancelledBtn.addEventListener('click', () => {
    const now = new Date();
    cancelledWeekInput.value = now.toISOString().slice(0, 7) + '-W' + getISOWeek(now);
    // Show current office in modal header
    const office = selectedOffice ? selectedOffice() : null;
    if (cancelledModalLabel && office) {
      cancelledModalLabel.innerHTML = `Cancelled Clients <span class="badge bg-primary ms-2">Office ${office}</span>`;
    }
    cancelledWeekInput.dispatchEvent(new Event('change'));
  });

  cancelledWeekInput.addEventListener('change', async () => {
    cancelledList.innerHTML = '';
    const weekValue = cancelledWeekInput.value; // format: YYYY-Www
    if (!weekValue) return;

    // Get start and end dates of the selected week
    const [year, weekStr] = weekValue.split('-W');
    const weekNum = parseInt(weekStr, 10);
    const startDate = getDateOfISOWeek(weekNum, parseInt(year, 10));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Query all policies for the selected office
    const office = selectedOffice ? selectedOffice() : null;
    if (!office) {
      cancelledList.innerHTML = '<div class="text-danger">No office selected.</div>';
      return;
    }

    const snapshot = await getDocs(collection(db, "policies"));
    // Filter by office, status cancelled, and dueDate in week
    const filtered = snapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      if (data.officeNumber !== office) return false;
      if ((data.status || '').toLowerCase() !== 'cancelled') return false;
      if (!data.dueDate) return false;
      // Parse dueDate
      let d;
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
        const [y, m, dNum] = data.dueDate.split('-').map(Number);
        d = new Date(y, m - 1, dNum);
      } else {
        d = new Date(data.dueDate);
      }
      // Cancelled date is one day after due date
      d.setDate(d.getDate() + 1);
      return d >= startDate && d <= endDate;
    });

    if (filtered.length === 0) {
      cancelledList.innerHTML = '<div class="text-muted">No cancelled clients for this week.</div>';
      return;
    }

    // Render flat list with proper case for client names
    function toProperCase(str) {
      return (str || "")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    filtered.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
      li.classList.add('bg-danger', 'bg-opacity-10', 'border', 'border-danger-subtle', 'text-dark');
      const firstName = toProperCase((data.clientFirstName || '').replace(/</g, '&lt;'));
      const lastName = toProperCase((data.clientLastName || '').replace(/</g, '&lt;'));
      li.innerHTML = `
        <span>
          <strong>${firstName} ${lastName}</strong>
          <span class="badge bg-white text-secondary border border-2 border-secondary-subtle ms-2">${data.language || 'English'}</span>
          <span class="badge bg-white text-secondary border border-2 border-secondary-subtle ms-2">${data.paymentPlan || ''}</span>
        </span>
        <span>
          <span class="badge bg-white border border-primary text-primary">${data.companyName || ''}</span>
          <span class="ms-2" style="vertical-align:middle;">
            <span class='badge bg-danger bg-opacity-25 text-dark border border-0'>Cancelled: ${formatDateDisplay(data.dueDate)}</span>
          </span>
        </span>
      `;
      if (data.notes && data.notes.trim() !== "") {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'mt-2 w-100';
        notesDiv.innerHTML = `<div class='border rounded bg-light px-2 py-1 small text-secondary'><strong>Notes:</strong> ${data.notes.replace(/</g, '&lt;')}</div>`;
        li.appendChild(notesDiv);
      }
      ul.appendChild(li);
    });
    cancelledList.appendChild(ul);
  });
}

// Helper: Get ISO week number
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return String(Math.ceil((((d - yearStart) / 86400000) + 1)/7)).padStart(2, '0');
}
// Helper: Get date of ISO week
function getDateOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  ISOweekStart.setHours(0,0,0,0);
  return ISOweekStart;
}
// Helper: Format date for display (cancelled date = dueDate + 1)
function formatDateDisplay(dueDateStr) {
  if (!dueDateStr) return '';
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
    const [y, m, dNum] = dueDateStr.split('-').map(Number);
    d = new Date(y, m - 1, dNum);
  } else {
    d = new Date(dueDateStr);
  }
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}
// --- View By Date Modal Logic ---
import { selectedOffice } from './officeState.js';
import { query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const dueDateInput = document.getElementById('dueDateFlatInput');
const flatDueDateList = document.getElementById('flatDueDateList');

if (dueDateInput && flatDueDateList) {
  dueDateInput.addEventListener('change', async () => {
    const selectedDate = dueDateInput.value;
    flatDueDateList.innerHTML = '';
    if (!selectedDate) return;

    // Query all policies for the selected office
    const office = selectedOffice ? selectedOffice() : null;
    if (!office) {
      flatDueDateList.innerHTML = '<div class="text-danger">No office selected.</div>';
      return;
    }

    const snapshot = await getDocs(collection(db, "policies"));
    // Filter by office and due date (YYYY-MM-DD)
    const filtered = snapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      return data.officeNumber === office && data.dueDate === selectedDate;
    });

    if (filtered.length === 0) {
      flatDueDateList.innerHTML = '<div class="text-muted">No clients due on this date.</div>';
      return;
    }

    // Render flat list
    function toProperCase(str) {
      return (str || "")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    filtered.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
      // Match accordion card background coloring
      const status = (data.status || '').toLowerCase();
      if (status === 'paid') {
        li.classList.add('bg-success', 'bg-opacity-10', 'border', 'border-success-subtle', 'text-dark');
      } else if (status === 'cancelled') {
        li.classList.add('bg-danger', 'bg-opacity-10', 'border', 'border-danger-subtle', 'text-dark');
      } else if (status === 'aware') {
        li.classList.add('bg-warning', 'bg-opacity-10', 'border', 'border-warning-subtle', 'text-dark');
      }
      const firstName = toProperCase((data.clientFirstName || '').replace(/</g, '&lt;'));
      const lastName = toProperCase((data.clientLastName || '').replace(/</g, '&lt;'));
      li.innerHTML = `
        <span>
          <strong>${firstName} ${lastName}</strong>
          <span class="badge bg-white text-secondary border border-2 border-secondary-subtle ms-2">${data.language || 'English'}</span>
          <span class="badge bg-white text-secondary border border-2 border-secondary-subtle ms-2">${data.paymentPlan || ''}</span>
        </span>
        <span>
          <span class="badge bg-white border border-primary text-primary">${data.companyName || ''}</span>
          <span class="ms-2" style="vertical-align:middle;">
            ${(() => {
              let badgeClass = "bg-warning bg-opacity-25 text-dark border border-0"; // default: Aware
              let statusText = data.status || "Aware";
              switch ((data.status || "Aware").toLowerCase()) {
                case "none":
                  badgeClass = "bg-secondary bg-opacity-25 text-dark border border-0";
                  statusText = "No Response from Ins";
                  break;
                case "paid":
                  badgeClass = "bg-success bg-opacity-25 text-dark border border-0";
                  statusText = "Paid";
                  break;
                case "aware":
                  badgeClass = "bg-warning bg-opacity-25 text-dark border border-0";
                  statusText = "Aware";
                  break;
                case "cancelled":
                  badgeClass = "bg-danger bg-opacity-25 text-dark border border-0";
                  // Cancel date is one day after due date
                  let cancelDate = "";
                  if (data.dueDate) {
                    let d;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
                      const [year, month, day] = data.dueDate.split('-').map(Number);
                      d = new Date(year, month - 1, day);
                    } else {
                      d = new Date(data.dueDate);
                    }
                    d.setDate(d.getDate() + 1);
                    cancelDate = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
                  }
                  statusText = cancelDate ? `Cancelled: ${cancelDate}` : "Cancelled";
                  break;
              }
              return `<span class='badge ${badgeClass}'>${statusText}</span>`;
            })()}
          </span>
        </span>
      `;
      // Show notes if present
      if (data.notes && data.notes.trim() !== "") {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'mt-2 w-100';
        notesDiv.innerHTML = `<div class='border rounded bg-light px-2 py-1 small text-secondary'><strong>Notes:</strong> ${data.notes.replace(/</g, '&lt;')}</div>`;
        li.appendChild(notesDiv);
      }
      ul.appendChild(li);
    });
    flatDueDateList.appendChild(ul);
  });
}
import { setOffice } from './officeState.js';
import { createAccordion } from './accordionRenderer.js';
import { db } from './firebaseConfig.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showForm } from './formHandler.js';

async function switchOffice(office) {
  setOffice(office);

  // Update the main title to reflect the selected office
  const mainTitle = document.getElementById('mainTitle');
  if (mainTitle) {
    mainTitle.textContent = `Pending Cancels ${office}`;
  }

  // Get the currently selected week (Monday)
  const weekInput = document.getElementById('weekStartInput');
  let weekStart = weekInput && weekInput.value ? weekInput.value : null;

  const snapshot = await getDocs(collection(db, "policies"));
  let filtered = snapshot.docs.filter(doc => doc.data().officeNumber === office);
  // Further filter by week if weekStart is set and valid
  if (weekStart) {
    // Helper: isDateInWeek (copied from accordionRenderer.js)
    function isDateInWeek(dateStr, weekStartStr) {
      if (!dateStr || !weekStartStr) return false;
      const [wy, wm, wd] = weekStartStr.split('-').map(Number);
      const weekStart = new Date(wy, wm - 1, wd);
      const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
        ? new Date(...dateStr.split('-').map((v, i) => i === 1 ? Number(v)-1 : Number(v)))
        : new Date(dateStr);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return d >= weekStart && d <= weekEnd;
    }
    filtered = filtered.filter(doc => isDateInWeek(doc.data().dueDate, weekStart));
  }
  createAccordion(filtered);
}


// Highlight active office button, update modal title, and sticky indicator
function setActiveOfficeButton(office) {
  document.querySelectorAll('.office-switch-btn').forEach(btn => {
    if (btn.dataset.office === String(office)) {
      btn.classList.remove('btn-outline-primary', 'btn-outline-secondary');
      btn.classList.add('btn-primary', 'active');
    } else {
      btn.classList.remove('btn-primary', 'active');
      if (btn.dataset.office === '215') {
        btn.classList.add('btn-outline-primary');
      } else {
        btn.classList.add('btn-outline-secondary');
      }
    }
  });
  // Update modal title if open
  const modalTitle = document.getElementById('byDateModalLabel');
  if (modalTitle) {
    modalTitle.innerHTML = `Clients Due On... <span class=\"badge bg-primary ms-2\">Office ${office}</span>`;
  }
  // Update sticky office indicator
  const stickyBadge = document.getElementById('stickyOfficeBadge');
  if (stickyBadge) {
    stickyBadge.textContent = office;
    if (String(office) === '219') {
      stickyBadge.classList.add('office-219-badge');
    } else {
      stickyBadge.classList.remove('office-219-badge');
    }
  }

  // If a date is selected in the View By Date modal, re-trigger the filter to update the list for the new office
  const dueDateInput = document.getElementById('dueDateFlatInput');
  if (dueDateInput && dueDateInput.value) {
    // Manually trigger the change event to refresh the list
    dueDateInput.dispatchEvent(new Event('change'));
  }
}

// Attach event listeners to all buttons with class 'office-switch-btn'
document.querySelectorAll('.office-switch-btn').forEach(button => {
  button.addEventListener('click', () => {
    const office = button.dataset.office;
    switchOffice(office);
    setActiveOfficeButton(office);
    // Persist office selection is handled in setOffice
  });
});

// On load, restore last selected office from localStorage
window.addEventListener('DOMContentLoaded', () => {
  // Minimize sidebar on page load (if sidebarToggle.js is present and sidebar exists)
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (sidebar && toggleBtn && !sidebar.classList.contains('sidebar-minimized')) {
    // Simulate a click to minimize if not already minimized
    toggleBtn.click();
  }
  // Restore last selected office
  import('./officeState.js').then(({ selectedOffice }) => {
    const office = selectedOffice();
    switchOffice(office);
    setActiveOfficeButton(office);
  });
});

// Attach event listeners to all 'Add Name' buttons
document.querySelectorAll('.add-name-btn').forEach(button => {
  button.addEventListener('click', () => {
    const office = button.dataset.office;
    showForm("", null, office); // Open form for the selected office
  });
});

// --- Navigation tab logic for Cancel Request page ---
document.addEventListener('DOMContentLoaded', () => {
  const pendingTab = document.querySelector('a.nav-link[href="#pendingCancels"]');
  const cancelTab = document.querySelector('a.nav-link[href="#cancelRequest"]');
  const mainContent = document.getElementById('mainContent');
  const cancelPage = document.getElementById('cancelRequestPage');
  const mainLayoutRow = document.getElementById('mainLayoutRow');
  if (pendingTab && cancelTab && mainContent && cancelPage && mainLayoutRow) {
    pendingTab.addEventListener('click', (e) => {
      e.preventDefault();
      mainLayoutRow.classList.remove('d-none');
      cancelPage.classList.add('d-none');
      pendingTab.classList.add('active');
      cancelTab.classList.remove('active');
    });
    cancelTab.addEventListener('click', (e) => {
      e.preventDefault();
      mainLayoutRow.classList.add('d-none');
      cancelPage.classList.remove('d-none');
      cancelTab.classList.add('active');
      pendingTab.classList.remove('active');
    });
  }
});



