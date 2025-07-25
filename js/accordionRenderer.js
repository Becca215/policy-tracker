import { showForm } from './formHandler.js';
import { db } from './firebaseConfig.js';
import { selectedOffice } from './officeState.js';
import {
  doc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let companies = [];
// Load companies from localStorage if present, else use default
const defaultCompanies = [
  { name: "Commonwealth", paymentLink: "" },
  { name: "American Access", paymentLink: "" },
  { name: "Bristol West", paymentLink: "" },
  { name: "Safeway", paymentLink: "" },
  { name: "Gainsco", paymentLink: "" },
  { name: "Progressive", paymentLink: "" },
  { name: "The General", paymentLink: "" },
  { name: "Star Casualty", paymentLink: "" },
  { name: "Advantage Mendota", paymentLink: "" },
  { name: "Assurance America", paymentLink: "" },
  { name: "Infinity / Kemper", paymentLink: "" },
  { name: "Legacy", paymentLink: "" },
  { name: "Falcon", paymentLink: "" }
];
try {
  const stored = localStorage.getItem('policyTrackerCompanies');
  if (stored) {
    companies = JSON.parse(stored);
  } else {
    companies = defaultCompanies.slice();
  }
} catch (e) {
  companies = defaultCompanies.slice();
}

// Add Company Form logic (sidebar) and carrier list with remove
function renderCarrierList() {
  const listDiv = document.getElementById('carrierList');
  if (!listDiv) return;
  listDiv.innerHTML = '';
  if (companies.length === 0) {
    listDiv.innerHTML = '<div class="text-muted small">No carriers added.</div>';
    return;
  }
  companies.forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center justify-content-between border rounded px-2 py-1 mb-1';
    row.innerHTML = `<span class='text-truncate' style='max-width:100px;'>${c.name}</span>
      <button class='btn btn-sm btn-link text-danger p-0 ms-2' title='Remove Carrier' data-remove-idx='${idx}'><i class='bi bi-trash'></i></button>`;
    listDiv.appendChild(row);
  });
  // Attach remove handlers
  listDiv.querySelectorAll('button[data-remove-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-remove-idx'));
      if (!isNaN(idx)) {
        const carrierName = companies[idx]?.name || 'this carrier';
        if (confirm(`Are you sure you want to delete '${carrierName}'?`)) {
          companies.splice(idx, 1);
          // Save to localStorage
          try { localStorage.setItem('policyTrackerCompanies', JSON.stringify(companies)); } catch (e) {}
          renderCarrierList();
          if (window._lastAccordionSnapshot && typeof createAccordion === 'function') {
            createAccordion(window._lastAccordionSnapshot);
          }
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const addForm = document.getElementById('addCompanyForm');
  const addCarrierFormContainer = document.getElementById('addCarrierFormContainer');
  const toggleAddCarrierBtn = document.getElementById('toggleAddCarrierFormBtn');
  const carrierListDiv = document.getElementById('carrierList');
  const toggleBtn = document.getElementById('toggleCarrierListBtn');

  if (toggleAddCarrierBtn && addCarrierFormContainer) {
    toggleAddCarrierBtn.addEventListener('click', () => {
      const isVisible = addCarrierFormContainer.style.display === 'block';
      addCarrierFormContainer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && addForm) {
        // Focus the name input when opening
        setTimeout(() => {
          const nameInput = document.getElementById('newCompanyName');
          if (nameInput) nameInput.focus();
        }, 100);
      }
    });
  }

  if (toggleBtn && carrierListDiv) {
    toggleBtn.addEventListener('click', () => {
      carrierListDiv.style.display = carrierListDiv.style.display === 'none' ? 'block' : 'none';
      if (carrierListDiv.style.display === 'block') {
        renderCarrierList();
      }
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('newCompanyName');
      const linkInput = document.getElementById('newCompanyPaymentLink');
      const name = nameInput.value.trim();
      const paymentLink = linkInput.value.trim();
      if (name && !companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        companies.push({ name, paymentLink });
        companies = companies.filter((c, i, arr) => arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === i)
          .sort((a, b) => a.name.localeCompare(b.name));
        // Save to localStorage
        try { localStorage.setItem('policyTrackerCompanies', JSON.stringify(companies)); } catch (e) {}
        nameInput.value = '';
        linkInput.value = '';
        renderCarrierList();
        if (window._lastAccordionSnapshot && typeof createAccordion === 'function') {
          createAccordion(window._lastAccordionSnapshot);
        }
        // Hide the form after adding
        if (addCarrierFormContainer) addCarrierFormContainer.style.display = 'none';
      } else {
        nameInput.classList.add('is-invalid');
        setTimeout(() => nameInput.classList.remove('is-invalid'), 1200);
      }
    });
    // Only render if visible
    if (carrierListDiv && carrierListDiv.style.display !== 'none') {
      renderCarrierList();
    }
  }

  // Clear the date selector and list every time the By Date modal is opened
  const byDateModal = document.getElementById('byDateModal');
  const dueDateFlatInput = document.getElementById('dueDateFlatInput');
  const flatDueDateList = document.getElementById('flatDueDateList');
  if (byDateModal && dueDateFlatInput && flatDueDateList) {
    byDateModal.addEventListener('show.bs.modal', () => {
      dueDateFlatInput.value = '';
      flatDueDateList.innerHTML = '<div class="text-muted text-center py-4">Please select a date to view clients.</div>';
    });
    // Optionally, clear the list if the input is cleared
    dueDateFlatInput.addEventListener('input', () => {
      if (!dueDateFlatInput.value) {
        flatDueDateList.innerHTML = '<div class="text-muted text-center py-4">Please select a date to view clients.</div>';
      }
    });
  }
});

const policiesList = document.getElementById('policiesList');

let openIds = [];

function saveOpenAccordions() {
  openIds = [];
  document.querySelectorAll('.accordion-collapse.show').forEach(openCollapse => {
    openIds.push(openCollapse.id);
  });
}

function restoreOpenAccordions() {
  openIds.forEach(id => {
    const collapseElement = document.getElementById(id);
    if (collapseElement) {
      const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
      if (!collapseElement.classList.contains('show')) {
        bsCollapse.show();
      }
    }
  });
}

function formatDateMMDDYY(dateStr) {
  if (!dateStr) return "";
  // If dateStr is YYYY-MM-DD, parse as local date to avoid timezone shift
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    d = new Date(year, month - 1, day); // JS Date: month is 0-based
  } else {
    d = new Date(dateStr);
  }
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit"
  });
}

function createAccordion(snapshot) {
  window._lastAccordionSnapshot = snapshot;
  policiesList.innerHTML = "";

  const grouped = {};
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const company = data.companyName || "Unknown Company";
    if (!grouped[company]) grouped[company] = [];
    grouped[company].push({
      id: docSnap.id,
      companyName: company,
      clientFirstName: data.clientFirstName,
      clientLastName: data.clientLastName,
      dueDate: data.dueDate,
      notes: data.notes || "",
      status: data.status || "",
      language: data.language || "",
      paymentPlan: data.paymentPlan || "", // <-- ensure paymentPlan is included
      text1SentAt: data.text1SentAt || null,
      text2SentAt: data.text2SentAt || null,
      text3SentAt: data.text3SentAt || null,
    });
  });

  const accordion = document.createElement('div');
  accordion.className = "accordion";
  accordion.id = "companiesAccordion";

  // Sort companies alphabetically for display
  const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  sortedCompanies.forEach((companyObj, index) => {
    const companyName = companyObj.name;
    let policies = grouped[companyName] || [];
    // Sort policies by dueDate ascending (earliest first)
    policies = policies.slice().sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      // Compare as local dates if YYYY-MM-DD, else Date parse
      const parse = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d)
        ? new Date(d + 'T00:00:00')
        : new Date(d);
      return parse(a.dueDate) - parse(b.dueDate);
    });

    const accordionItem = document.createElement('div');
    accordionItem.className = "accordion-item mb-2 border rounded";

    const header = document.createElement('h2');
    header.className = "accordion-header";
    header.id = `heading-${index}`;

    const button = document.createElement('button');
    button.className = "accordion-button collapsed fw-bold";

    if (policies.length > 0) {
      button.classList.add("accordionWithClients");
    } else {
      button.classList.add("bg-light", "bg-gradient", "text-muted");
    }

    button.type = "button";
    button.setAttribute("data-bs-toggle", "collapse");
    button.setAttribute("data-bs-target", `#collapse-${index}`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `collapse-${index}`);
    button.textContent = `${companyName} (${policies.length})`;

    header.appendChild(button);
    accordionItem.appendChild(header);

    const collapseDiv = document.createElement('div');
    collapseDiv.id = `collapse-${index}`;
    collapseDiv.className = "accordion-collapse collapse";
    collapseDiv.setAttribute("aria-labelledby", `heading-${index}`);
    collapseDiv.setAttribute("data-bs-parent", "#companiesAccordion");

    const bodyDiv = document.createElement('div');
    bodyDiv.className = "accordion-body bg-light";

        // Add drop shadow to open accordions for focus indication
        collapseDiv.addEventListener('show.bs.collapse', () => {
          accordionItem.classList.add('shadow-lg');
        });
        collapseDiv.addEventListener('hide.bs.collapse', () => {
          accordionItem.classList.remove('shadow-lg');
        });

    // Add Name button and inline form container
    const addBtnContainer = document.createElement('div');
    addBtnContainer.className = 'mt-3';
    const addButton = document.createElement('button');
    addButton.className = "btn btn-sm add-client-btn";
    addButton.textContent = "Add Name";
    addButton.type = 'button';
    addButton.style.minWidth = '110px';
    addBtnContainer.appendChild(addButton);
    // Inline form container
    const inlineFormDiv = document.createElement('div');
    inlineFormDiv.className = 'mt-2 d-none accordion-client-form';
    addBtnContainer.appendChild(inlineFormDiv);
    bodyDiv.appendChild(addBtnContainer);

    // Only one inline form open at a time
    addButton.addEventListener('click', () => {
      // Hide all other open inline forms
      document.querySelectorAll('.inline-add-form').forEach(div => {
        div.classList.add('d-none');
        div.innerHTML = '';
      });
      inlineFormDiv.classList.remove('d-none');
      // Render the form
      renderInlineAddForm(inlineFormDiv, companyName, selectedOffice());
    });
// Render the inline add form for a company
function renderInlineAddForm(container, companyName, officeNumber) {
  // Simple form markup (customize as needed)
  container.classList.add('inline-add-form');
  container.innerHTML = `
    <form class="border rounded p-2 bg-white shadow-sm w-100" style="max-width:700px;">
      <div class="row g-2 mb-2">
        <div class="col-md-3 col-6">
          <label for="add-clientFirstName" class="form-label form-label-sm mb-0">First Name</label>
          <input id="add-clientFirstName" type="text" class="form-control form-control-sm" name="clientFirstName" placeholder="First Name" required />
        </div>
        <div class="col-md-3 col-6">
          <label for="add-clientLastName" class="form-label form-label-sm mb-0">Last Name</label>
          <input id="add-clientLastName" type="text" class="form-control form-control-sm" name="clientLastName" placeholder="Last Name" required />
        </div>
        <div class="col-md-3 col-6">
          <label for="add-companyName" class="form-label form-label-sm mb-0">Company</label>
          <input id="add-companyName" type="text" class="form-control form-control-sm company-name-readonly" name="companyName" value="${companyName}" readonly disabled tabindex="-1" />
        </div>
        <div class="col-md-3 col-6">
          <label for="add-dueDate" class="form-label form-label-sm mb-0">Last Day</label>
          <input id="add-dueDate" type="date" class="form-control form-control-sm" name="dueDate" required />
        </div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-4 col-6">
          <label for="add-language" class="form-label form-label-sm mb-0">Language</label>
          <select id="add-language" class="form-select form-select-sm" name="language">
            <option value="EN">EN</option>
            <option value="SP">SP</option>
          </select>
        </div>
        <div class="col-md-4 col-6">
          <label for="add-paymentPlan" class="form-label form-label-sm mb-0">Payment Plan</label>
          <select id="add-paymentPlan" class="form-select form-select-sm" name="paymentPlan">
            <option value="Direct Bill">Direct Bill</option>
            <option value="Autopay">Autopay</option>
          </select>
        </div>
        <div class="col-md-4 col-12">
          <label for="add-status" class="form-label form-label-sm mb-0">Status</label>
          <select id="add-status" class="form-select form-select-sm" name="status">
            <option value="none">No Response from Ins</option>
            <option value="paid">Paid</option>
            <option value="aware">Aware</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div class="mb-2">
        <label for="add-notes" class="form-label form-label-sm mb-0">Notes</label>
        <textarea id="add-notes" class="form-control form-control-sm" name="notes" placeholder="Notes"></textarea>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <button type="submit" class="btn btn-success btn-sm">Save</button>
        <button type="button" class="btn btn-link btn-sm text-danger close-inline-form">Cancel</button>
      </div>
    </form>
  `;
  // Cancel button closes the form
  container.querySelector('.close-inline-form').addEventListener('click', () => {
    container.classList.add('d-none');
    container.innerHTML = '';
  });
  // Handle form submit
  container.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const dueDate = form.dueDate.value;
    // Get selected week start
    const weekStartInput = document.getElementById('weekStartInput');
    const weekStart = weekStartInput && weekStartInput.value ? weekStartInput.value : null;
    // Use isDateInWeek from this file
    if (!isDateInWeek(dueDate, weekStart)) {
      alert('The Last Day must be within the currently selected week.');
      form.dueDate.classList.add('is-invalid');
      setTimeout(() => form.dueDate.classList.remove('is-invalid'), 1500);
      return;
    }
    const data = {
      clientFirstName: form.clientFirstName.value.trim(),
      clientLastName: form.clientLastName.value.trim(),
      companyName: form.companyName.value,
      dueDate: dueDate,
      language: form.language.value,
      paymentPlan: form.paymentPlan.value,
      status: form.status.value,
      notes: form.notes.value.trim(),
      officeNumber: officeNumber
    };
    // Add to Firestore
    try {
      // Save open accordions BEFORE add so Firestore re-render uses correct openIds
      if (typeof saveOpenAccordions === 'function') saveOpenAccordions();
      await import('./firebaseConfig.js').then(({ db }) =>
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(({ collection, addDoc }) =>
          addDoc(collection(db, 'policies'), data)
        )
      );
      container.classList.add('d-none');
      container.innerHTML = '';
      // UI will update via Firestore onSnapshot; no manual rerender needed
    } catch (err) {
      alert('Error adding client: ' + err.message);
    }
  });
}

    const ul = document.createElement('ul');
    ul.className = "list-group";

    policies.forEach(policy => {
      const li = document.createElement('li');
      li.className = "list-group-item py-2";
      // If status is paid, make the whole card green like the badge
      if ((policy.status || "").toLowerCase() === "paid") {
        li.classList.add("bg-success", "bg-opacity-10", "border", "border-success-subtle", "text-dark");
      } else if ((policy.status || "").toLowerCase() === "cancelled") {
        // If status is cancelled, make the whole card subtle red
        li.classList.add("bg-danger", "bg-opacity-10", "border", "border-danger-subtle", "text-dark");
      } else if ((policy.status || "").toLowerCase() === "aware") {
        // If status is aware, make the whole card subtle yellow
        li.classList.add("bg-warning", "bg-opacity-10", "border", "border-warning-subtle", "text-dark");
      }

      // ======= Compact Top Row =======
      const topRow = document.createElement('div');
      topRow.className = "d-flex justify-content-between align-items-center flex-wrap gap-2";

      const leftSide = document.createElement('div');
      leftSide.className = "d-flex align-items-center gap-2 flex-wrap";

      const nameEl = document.createElement('span');
      nameEl.className = "fw-bold client-name-small";
      // Capitalize first letter of each word
      function toProperCase(str) {
        return (str || "")
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      nameEl.textContent = `${toProperCase(policy.clientFirstName)} ${toProperCase(policy.clientLastName)}`;


      const langBadge = document.createElement('span');
      // Match payment plan badge style: white bg, grey border, grey text
      langBadge.className = "badge text-secondary bg-white border border-2 border-secondary-subtle";
      langBadge.textContent = policy.language || "English";

      // Payment Plan badge
      const planBadge = document.createElement('span');
      planBadge.className = "badge text-secondary bg-white border border-2 border-secondary-subtle";
      planBadge.textContent = policy.paymentPlan || "";



      const dueEl = document.createElement('span');
      dueEl.className = "badge border border-2 border-primary text-primary bg-white fw-bold";
      dueEl.style.backgroundColor = "transparent";
      dueEl.style.fontWeight = "bold";
      dueEl.textContent = policy.dueDate
        ? (() => {
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
              const [year, month, day] = policy.dueDate.split('-').map(Number);
              d = new Date(year, month - 1, day);
            } else {
              d = new Date(policy.dueDate);
            }
            return `LD: ${d.getMonth() + 1}/${d.getDate()}`;
          })()
        : "";


      const statusBadge = document.createElement('span');
      let badgeClass = "bg-warning bg-opacity-25 text-dark border border-0"; // default: Aware (pastel yellow)
      let statusText = policy.status || "Aware";
      switch ((policy.status || "Aware").toLowerCase()) {
        case "none":
          badgeClass = "badge-noresponse";
          statusText = "No Response";
          break;
        case "paid":
          badgeClass = "badge-paid";
          statusText = "Paid";
          break;
        case "aware":
          badgeClass = "bg-warning bg-opacity-25 text-dark border border-0"; // pastel yellow
          statusText = "Aware";
          break;
        case "cancelled":
          badgeClass = "badge-cancelled";
          // Cancel date is one day after due date
          let cancelDate = "";
          if (policy.dueDate) {
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
              const [year, month, day] = policy.dueDate.split('-').map(Number);
              d = new Date(year, month - 1, day);
            } else {
              d = new Date(policy.dueDate);
            }
            d.setDate(d.getDate() + 1);
            // Format as mm/dd only
            cancelDate = `${d.getMonth() + 1}/${d.getDate()}`;
          }
          statusText = cancelDate ? `Cancelled: ${cancelDate}` : "Cancelled";
          break;
      }
      statusBadge.className = `badge ${badgeClass}`;
      statusBadge.textContent = statusText;

      leftSide.append(nameEl, dueEl, langBadge, planBadge, statusBadge);

      const rightSide = document.createElement('div');
      rightSide.className = "d-flex align-items-center gap-2 flex-wrap";

      // Add labels for each text reminder
      const textLabels = ["Txt 1", "Txt 2", "Txt 3"];
      const textRow = document.createElement('div');
      textRow.className = 'd-flex text-reminder-row';
      ["text1SentAt", "text2SentAt", "text3SentAt"].forEach((field, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = "d-flex flex-column align-items-center me-2";

        // Label above checkbox
        const labelEl = document.createElement('span');
        labelEl.className = 'text-reminder-label';
        labelEl.textContent = textLabels[idx];
        wrapper.appendChild(labelEl);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.checked = policy[field] !== null;
        checkbox.dataset.policyId = policy.id;
        checkbox.dataset.field = field;
        // Set initial green style if checked
        if (checkbox.checked) {
          checkbox.style.backgroundColor = '#198754';
          checkbox.style.borderColor = '#198754';
        }

        // Date badge
        const label = document.createElement('span');
        label.className = 'small ms-1';
        if (policy[field]) {
          const d = new Date(policy[field]);
          label.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
          label.style.background = '';
          label.style.color = '#193c57';
          label.style.borderRadius = '8px';
          label.style.padding = '0 6px';
        } else {
          label.textContent = '';
          label.style.background = '';
          label.style.color = '';
          label.style.borderRadius = '';
          label.style.padding = '';
        }

        checkbox.addEventListener('change', async (event) => {
          event.stopPropagation();
          const docRef = doc(db, "policies", policy.id);
          const updateData = {};
          if (checkbox.checked) {
            updateData[field] = new Date().toISOString();
            checkbox.style.backgroundColor = '#198754';
            checkbox.style.borderColor = '#198754';
          } else {
            updateData[field] = null;
            checkbox.style.backgroundColor = '';
            checkbox.style.borderColor = '';
          }
          await updateDoc(docRef, updateData);
          policy[field] = updateData[field];
          if (policy[field]) {
            const d = new Date(updateData[field]);
            label.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
            label.style.background = '';
            label.style.color = '#193c57';
            label.style.borderRadius = '8px';
            label.style.padding = '0 6px';
          } else {
            label.textContent = '';
            label.style.background = '';
            label.style.color = '';
            label.style.borderRadius = '';
            label.style.padding = '';
          }
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        textRow.appendChild(wrapper);
      });
      rightSide.appendChild(textRow);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-primary d-flex align-items-center';
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.title = 'Edit';
      // Inline edit form container
      const editFormDiv = document.createElement('div');
      editFormDiv.className = 'mt-2 d-none accordion-client-form';
      li.appendChild(editFormDiv);
      editBtn.addEventListener('click', () => {
        // Hide all other open inline forms (add or edit)
        document.querySelectorAll('.inline-add-form, .inline-edit-form').forEach(div => {
          div.classList.add('d-none');
          div.innerHTML = '';
        });
        editFormDiv.classList.remove('d-none');
        renderInlineEditForm(editFormDiv, policy, policy.companyName, policy.officeNumber || selectedOffice());
      });
// Render the inline edit form for a policy
function renderInlineEditForm(container, policy, companyName, officeNumber) {
  container.classList.add('inline-edit-form');
  container.innerHTML = `
    <form class="border rounded p-2 bg-white shadow-sm w-100" style="max-width:700px;">
      <div class="row g-2 mb-2">
        <div class="col-md-3 col-6">
          <label for="edit-clientFirstName" class="form-label form-label-sm mb-0">First Name</label>
          <input id="edit-clientFirstName" type="text" class="form-control form-control-sm" name="clientFirstName" value="${policy.clientFirstName || ''}" placeholder="First Name" required />
        </div>
        <div class="col-md-3 col-6">
          <label for="edit-clientLastName" class="form-label form-label-sm mb-0">Last Name</label>
          <input id="edit-clientLastName" type="text" class="form-control form-control-sm" name="clientLastName" value="${policy.clientLastName || ''}" placeholder="Last Name" required />
        </div>
        <div class="col-md-3 col-6">
          <label for="edit-companyName" class="form-label form-label-sm mb-0">Company</label>
          <input id="edit-companyName" type="text" class="form-control form-control-sm company-name-readonly" name="companyName" value="${companyName}" readonly disabled tabindex="-1" />
        </div>
        <div class="col-md-3 col-6">
          <label for="edit-dueDate" class="form-label form-label-sm mb-0">Last Day</label>
          <input id="edit-dueDate" type="date" class="form-control form-control-sm" name="dueDate" value="${policy.dueDate || ''}" required />
        </div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-4 col-6">
          <label for="edit-language" class="form-label form-label-sm mb-0">Language</label>
          <select id="edit-language" class="form-select form-select-sm" name="language">
            <option value="EN" ${policy.language === 'EN' ? 'selected' : ''}>EN</option>
            <option value="SP" ${policy.language === 'SP' ? 'selected' : ''}>SP</option>
          </select>
        </div>
        <div class="col-md-4 col-6">
          <label for="edit-paymentPlan" class="form-label form-label-sm mb-0">Payment Plan</label>
          <select id="edit-paymentPlan" class="form-select form-select-sm" name="paymentPlan">
            <option value="Direct Bill" ${policy.paymentPlan === 'Direct Bill' ? 'selected' : ''}>Direct Bill</option>
            <option value="Autopay" ${policy.paymentPlan === 'Autopay' ? 'selected' : ''}>Autopay</option>
          </select>
        </div>
        <div class="col-md-4 col-12">
          <label for="edit-status" class="form-label form-label-sm mb-0">Status</label>
          <select id="edit-status" class="form-select form-select-sm" name="status">
            <option value="none" ${(policy.status || '').toLowerCase() === 'none' ? 'selected' : ''}>No Response from Ins</option>
            <option value="paid" ${(policy.status || '').toLowerCase() === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="aware" ${(policy.status || '').toLowerCase() === 'aware' ? 'selected' : ''}>Aware</option>
            <option value="cancelled" ${(policy.status || '').toLowerCase() === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>
      <div class="mb-2">
        <label for="edit-notes" class="form-label form-label-sm mb-0">Notes</label>
        <textarea id="edit-notes" class="form-control form-control-sm" name="notes" placeholder="Notes">${policy.notes || ''}</textarea>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <button type="submit" class="btn btn-success btn-sm">Save</button>
        <button type="button" class="btn btn-link btn-sm text-danger close-inline-form">Cancel</button>
      </div>
    </form>
  `;
  // Cancel button closes the form
  container.querySelector('.close-inline-form').addEventListener('click', () => {
    container.classList.add('d-none');
    container.innerHTML = '';
  });
  // Handle form submit
  container.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      clientFirstName: form.clientFirstName.value.trim(),
      clientLastName: form.clientLastName.value.trim(),
      companyName: form.companyName.value,
      dueDate: form.dueDate.value,
      language: form.language.value,
      paymentPlan: form.paymentPlan.value,
      status: form.status.value,
      notes: form.notes.value.trim(),
      officeNumber: officeNumber
    };
    // Update Firestore
    try {
    } catch (err) {
      alert('Error updating client: ' + err.message);
    }
    try {
      // Save open accordions BEFORE update so Firestore re-render uses correct openIds
      if (typeof saveOpenAccordions === 'function') saveOpenAccordions();
      await import('./firebaseConfig.js').then(({ db }) =>
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(({ doc, updateDoc }) =>
          updateDoc(doc(db, 'policies', policy.id), data)
        )
      );
      container.classList.add('d-none');
      container.innerHTML = '';
      // UI will update via Firestore onSnapshot; no manual rerender needed
    } catch (err) {
      alert('Error updating client: ' + err.message);
    }
  });
}

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger d-flex align-items-center';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this client?')) {
          try {
            await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(firestore => {
              const { doc, deleteDoc } = firestore;
              const docRef = doc(db, "policies", policy.id);
              deleteDoc(docRef);
            });
          } catch (error) {
            alert('Error deleting client.');
          }
        }
      });

      rightSide.appendChild(editBtn);
      rightSide.appendChild(deleteBtn);

      // ====== Notes Toggle Button ======
      const notesToggleBtn = document.createElement('button');
      notesToggleBtn.className = 'btn btn-sm btn-link p-0 text-decoration-underline';
      notesToggleBtn.textContent = 'Show Notes';


      const notesDiv = document.createElement('div');
      notesDiv.className = 'mt-1 d-none'; // less margin-top for compactness

      // Compact notes container
      const notesContainer = document.createElement('div');
      notesContainer.className = 'notes-container p-0'; // remove extra padding

      const textarea = document.createElement('textarea');
      textarea.className = 'form-control form-control-sm py-1 px-2'; // smaller, less padding
      textarea.style.minHeight = '32px';
      textarea.style.maxHeight = '60px';
      // Show Copy Reminder button for 'No Response from Ins' and a different one for 'Cancelled'
      const status = (policy.status || '').toLowerCase();
      const clientName = toProperCase(policy.clientFirstName).trim();
      const companyName = policy.companyName || '';
      // Payment links by company
      const paymentLinks = {
        "Commonwealth": "https://payments.commonwealthcasualty.com/singlepayment",
        "American Access": "https://customer.aains.com/?lang=en",
        "Bristol": "https://www.bristolwest.com/nologin?type=pay",
        "Safeway": "https://www.mysafeway.com/default.aspx?Lang=EN",
        "Gainsco": "https://www.gainsco.com/customers/make-a-payment/",
        "Progressive": "https://account.apps.progressive.com/access/ez-payment/policy-info",
        "Freedom General": "https://freedomgeneral.com/",
        "Star Casualty": "https://www.starcasualty.com/pay-my-bill.cfm",
        "Advantage": "https://www.advantageauto.com/PaymentTerms.aspx",
        "Assurance": "https://www.assuranceamerica.com/payment.asp",
        "Infinity": "https://www.infinityauto.com/make-your-payments-go",
        "Legacy": "https://legacypay.wnins.com/Account/QuickPay?f=login",
        "Falcon": "https://insured.falconinsgroup.com/en/Customers/Payment"
      };
      let paymentLink = '';
      for (const [key, url] of Object.entries(paymentLinks)) {
        if (companyName.toLowerCase().includes(key.toLowerCase())) {
          paymentLink = url;
          break;
        }
      }
      const officeNum = policy.officeNumber || (typeof selectedOffice === 'function' ? selectedOffice() : '');
      let officePhone = '';
      if (officeNum == '215') {
        officePhone = '(480)421-5777';
      } else if (officeNum == '219') {
        officePhone = '(480)454-7275';
      } else {
        officePhone = '';
      }
      if (status === 'none' || status === 'no response from ins') {
        const copyReminderBtn = document.createElement('button');
        copyReminderBtn.className = 'btn btn-sm btn-outline-secondary ms-1';
        copyReminderBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
        copyReminderBtn.title = 'Copy reminder message to clipboard';
        copyReminderBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lastDay = policy.dueDate ? (() => {
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
              const [y, m, day] = policy.dueDate.split('-').map(Number);
              d = new Date(y, m - 1, day);
            } else {
              d = new Date(policy.dueDate);
            }
            return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
          })() : '';
          let msg = '';
          if ((policy.language || '').toUpperCase() === 'SP') {
            msg = `Hola ${clientName},\nQueríamos recordarle que su póliza con ${companyName} está pendiente de cancelación. Para evitar la cancelación, haga un pago no mas tarde que ${lastDay}.`;
            if (paymentLink) {
              msg += ` Puede pagar en línea aquí: ${paymentLink}.`;
            }
            msg += ` También puede pagar visitando nuestra oficina o llamándonos al ${officePhone}. ¡Gracias por elegir Estrella Insurance! ¡Que tenga un excelente día!`;
            // Check if last day is Sunday, and append at the end
            let isSunday = false;
            if (policy.dueDate) {
              let d;
              if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
                const [y, m, day] = policy.dueDate.split('-').map(Number);
                d = new Date(y, m - 1, day);
              } else {
                d = new Date(policy.dueDate);
              }
              if (d.getDay() === 0) isSunday = true;
            }
            if (isSunday) {
              msg += `\nEstamos cerrados los domingos.`;
            }
          } else {
            msg = `Hi ${clientName},\nWe wanted to remind you that your policy with ${companyName} is currently pending cancellation. To avoid cancellation, please make a payment no later than ${lastDay}.`;
            if (paymentLink) {
              msg += ` You can pay online here: ${paymentLink}.`;
            }
            msg += ` You can also pay by visiting our office or calling us at ${officePhone}. Thank you for choosing Estrella Insurance. Have a great day!`;
            // Check if last day is Sunday, and append at the end
            let isSunday = false;
            if (policy.dueDate) {
              let d;
              if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
                const [y, m, day] = policy.dueDate.split('-').map(Number);
                d = new Date(y, m - 1, day);
              } else {
                d = new Date(policy.dueDate);
              }
              if (d.getDay() === 0) isSunday = true;
            }
            if (isSunday) {
              msg += `\nWe are closed on Sundays.`;
            }
          }
          navigator.clipboard.writeText(msg).then(() => {
            copyReminderBtn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
            setTimeout(() => {
              copyReminderBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 1200);
          });
        });
        leftSide.appendChild(copyReminderBtn);
      } else if (status === 'cancelled') {
        const copyCancelledBtn = document.createElement('button');
        copyCancelledBtn.className = 'btn btn-sm btn-outline-danger ms-1';
        copyCancelledBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
        copyCancelledBtn.title = 'Copy cancellation notice to clipboard';
        copyCancelledBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Cancel date is one day after due date
          let cancelDate = '';
          if (policy.dueDate) {
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(policy.dueDate)) {
              const [y, m, day] = policy.dueDate.split('-').map(Number);
              d = new Date(y, m - 1, day);
            } else {
              d = new Date(policy.dueDate);
            }
            d.setDate(d.getDate() + 1);
            cancelDate = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
          }
          let msg = '';
          if ((policy.language || '').toUpperCase() === 'SP') {
            msg = `Hola ${clientName},\nQueríamos informarle que su póliza con ${companyName} fue cancelada por falta de pago el ${cancelDate}. Por favor, pague visitando nuestra oficina, llamándonos al ${officePhone}`;
            if (paymentLink) {
              msg += `, o en línea en ${paymentLink}`;
            }
            msg += `.\n¡Gracias por elegir Estrella Insurance! ¡Que tenga un excelente día!`;
          } else {
            msg = `Hello ${clientName},\nWe wanted to inform you that your policy with ${companyName} was canceled due to non-payment on ${cancelDate}. Please pay by visiting our office, calling us at ${officePhone}`;
            if (paymentLink) {
              msg += `, or online at ${paymentLink}`;
            }
            msg += `.\nThank you for choosing Estrella Insurance. Have a great day!`;
          }
          navigator.clipboard.writeText(msg).then(() => {
            copyCancelledBtn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
            setTimeout(() => {
              copyCancelledBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 1200);
          });
        });
        leftSide.appendChild(copyCancelledBtn);
      }
      textarea.placeholder = 'Notes';
    // Auto-save notes to Firestore on change
    textarea.addEventListener('change', async (e) => {
      const newNotes = e.target.value;
      try {
        await updateDoc(doc(db, 'policies', policy.id), { notes: newNotes });
        policy.notes = newNotes; // update local object for immediate UI feedback
      } catch (err) {
        alert('Error saving notes: ' + err.message);
      }
    });
      textarea.value = policy.notes || "";
      textarea.setAttribute('data-policy-id', policy.id);

      notesContainer.appendChild(textarea);
      notesDiv.appendChild(notesContainer);

      notesToggleBtn.addEventListener('click', () => {
        notesDiv.classList.toggle('d-none');
        notesToggleBtn.textContent = notesDiv.classList.contains('d-none')
          ? 'Show Notes'
          : 'Hide Notes';
      });

      topRow.appendChild(leftSide);
      topRow.appendChild(rightSide);

      li.appendChild(topRow);
      li.appendChild(notesToggleBtn);
      li.appendChild(notesDiv);

      ul.appendChild(li);
    });

    bodyDiv.appendChild(ul);
    collapseDiv.appendChild(bodyDiv);
    accordionItem.appendChild(collapseDiv);
    accordion.appendChild(accordionItem);
  });

  policiesList.appendChild(accordion);

  const collapseTriggers = accordion.querySelectorAll('[data-bs-toggle="collapse"]');
  collapseTriggers.forEach(trigger => {
    const targetSelector = trigger.getAttribute('data-bs-target');
    const target = document.querySelector(targetSelector);
    if (target) {
      new bootstrap.Collapse(target, { toggle: false });
    }
  });

  restoreOpenAccordions();
}


// Firestore listener
let isFirstLoad = true;


function getSelectedWeekStart() {
  const input = document.getElementById('weekStartInput');
  return input && input.value ? input.value : null;
}

function isDateInWeek(dateStr, weekStartStr) {
  if (!dateStr || !weekStartStr) return false;
  // Parse both as local dates
  const [wy, wm, wd] = weekStartStr.split('-').map(Number);
  const weekStart = new Date(wy, wm - 1, wd);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(...dateStr.split('-').map((v, i) => i === 1 ? Number(v)-1 : Number(v)))
    : new Date(dateStr);
  // Week is Monday to Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return d >= weekStart && d <= weekEnd;
}

function filterPoliciesByWeek(snapshot) {
  const weekStart = getSelectedWeekStart();
  return snapshot.docs.filter(docSnap => {
    const data = docSnap.data();
    return data.officeNumber === selectedOffice() && isDateInWeek(data.dueDate, weekStart);
  });
}

function rerenderAccordion(snapshot) {
  const filteredSnapshot = filterPoliciesByWeek(snapshot);
  createAccordion(filteredSnapshot);
}


let unsubscribePolicies = null;
function listenToOfficePolicies() {
  if (unsubscribePolicies) unsubscribePolicies();
  const office = selectedOffice();
  const q = query(collection(db, "policies"), where("officeNumber", "==", office));
  unsubscribePolicies = onSnapshot(q, (snapshot) => {
    window._lastAccordionSnapshot = snapshot;
    // Listen for week selector changes
    const weekInput = document.getElementById('weekStartInput');
    function isMonday(dateStr) {
      if (!dateStr) return false;
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.getDay() === 1; // Monday = 1
    }
    function showMondayOnlyMessage() {
      const policiesList = document.getElementById('policiesList');
      if (policiesList) {
        policiesList.innerHTML = '<div class="alert alert-warning text-center my-4">Please select a Monday as the start of the week.</div>';
      }
    }
    function rerenderAccordionMondayOnly(snapshot) {
      const weekStart = getSelectedWeekStart();
      if (!isMonday(weekStart)) {
        showMondayOnlyMessage();
        return;
      }
      rerenderAccordion(snapshot);
    }
    if (weekInput && !weekInput._accordionListener) {
      weekInput.addEventListener('input', () => {
        if (window._lastAccordionSnapshot) {
          rerenderAccordionMondayOnly(window._lastAccordionSnapshot);
        }
      });
      weekInput._accordionListener = true;
    }
    const weekStart = getSelectedWeekStart();
    if (!isMonday(weekStart)) {
      showMondayOnlyMessage();
      return;
    }
    const filteredSnapshot = filterPoliciesByWeek(snapshot);
    if (isFirstLoad) {
      createAccordion(filteredSnapshot);
      isFirstLoad = false;
    } else {
      saveOpenAccordions();
      createAccordion(filteredSnapshot);
      restoreOpenAccordions();
    }
  });
}

// Listen for office changes and re-run listener
document.addEventListener('DOMContentLoaded', () => {
  listenToOfficePolicies();
  // Listen for office switch buttons
  document.querySelectorAll('.office-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => listenToOfficePolicies(), 100); // Wait for office to update in localStorage
    });
  });
});

function updatePolicyTimestampUI(docSnap) {
  const data = docSnap.data();
  const policyId = docSnap.id;

  ["text1SentAt", "text2SentAt", "text3SentAt"].forEach(field => {
    const checkbox = document.querySelector(`input[data-policy-id="${policyId}"][data-field="${field}"]`);
    const label = checkbox ? checkbox.nextElementSibling : null;
    if (checkbox && label) {
      checkbox.checked = data[field] !== null;
      label.textContent = data[field]
        ? formatDateMMDDYY(data[field])
        : '';
    }
  });
}

export { createAccordion };




