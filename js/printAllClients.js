// Print All Client Info Modal
// Adds a Print button that opens a modal with a flat table of all visible client info (name, company, due date, status, language, payment plan, notes, etc) for the current view.
// No CSV export. Print opens a print dialog for just the table.

function getAllClientInfoRows() {
  const policiesList = document.getElementById('policiesList');
  if (!policiesList) return [];
  const rows = [];
  const accordion = policiesList.querySelector('.accordion');
  if (!accordion) return [];
  const companySections = accordion.querySelectorAll('.accordion-item');
  companySections.forEach(section => {
    // Get company name from header/button
    let companyName = '';
    const headerBtn = section.querySelector('.accordion-button');
    if (headerBtn) {
      companyName = headerBtn.textContent.trim();
      // Remove trailing count in parentheses, e.g., "Company Name (3)" -> "Company Name"
      companyName = companyName.replace(/\s*\(\d+\)$/, '');
    } else {
      const alt = section.querySelector('strong, h2, h3');
      if (alt) {
        companyName = alt.textContent.trim().replace(/\s*\(\d+\)$/, '');
      }
    }
    // Find all client rows in this section
    const clientRows = section.querySelectorAll('.list-group-item');
    clientRows.forEach(row => {
      // Extract info from the row
      const nameEl = row.querySelector('.client-name-small');
      const dueEl = row.querySelector('.badge.border-primary');
      const langBadge = row.querySelector('.badge.text-secondary');
      const planBadge = row.querySelectorAll('.badge.text-secondary')[1];
      const statusBadge = row.querySelector('.badge:not(.text-secondary):not(.border-primary)');
      const notesBtn = row.querySelector('button');
      let notes = '';
      // Try to find notes in the next sibling div (notesDiv)
      const notesDiv = row.querySelector('.notes-div, .notes-container, .d-none');
      if (notesDiv && notesDiv.textContent) {
        notes = notesDiv.textContent.trim();
      } else {
        // fallback: look for textarea
        const textarea = row.querySelector('textarea');
        if (textarea) notes = textarea.value.trim();
      }
      // Extract just the date from the badge (remove 'LD:' and whitespace)
      let lastDay = '';
      if (dueEl) {
        const match = dueEl.textContent.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
        if (match) {
          lastDay = match[0];
        }
      }
      rows.push({
        name: nameEl ? nameEl.textContent.trim() : '',
        company: companyName,
        lastDay: lastDay,
        status: statusBadge ? statusBadge.textContent.trim() : '',
        language: langBadge ? langBadge.textContent.trim() : '',
        // paymentPlan removed
        notes: notes
      });
    });
  });
  return rows;
}


function printAllClientsDirect() {
  const rows = getAllClientInfoRows();
  let html = '';
  if (rows.length === 0) {
    html = '<div class="text-muted">No clients found.</div>';
  } else {
    html = `<div class='table-responsive'><table class="table table-sm table-bordered"><thead><tr><th>Name</th><th>Company</th><th>Last Day</th><th>Status</th><th>Language</th><th style="min-width:260px;">Notes</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.name}</td><td>${r.company}</td><td>${r.lastDay}</td><td>${r.status}</td><td>${r.language}</td><td>${r.notes}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const printWindow = window.open('', '', 'width=900,height=1200');
  printWindow.document.write('<html><head><title>All Client Information</title>');
  printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css">');
  printWindow.document.write('</head><body>');
  printWindow.document.write(html);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// Add button to UI
function addPrintAllClientsButton() {
  const pendingCancels = document.getElementById('pendingCancels');
  if (!pendingCancels) return;
  let btn = document.getElementById('printAllClientsBtnMain');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'printAllClientsBtnMain';
    btn.className = 'btn btn-outline-secondary btn-sm ms-2';
    btn.innerHTML = '<i class="bi bi-printer"></i> Print';
    const controls = pendingCancels.querySelector('.d-flex');
    if (controls) controls.appendChild(btn);
    btn.onclick = printAllClientsDirect;
  }
}

document.addEventListener('DOMContentLoaded', addPrintAllClientsButton);
