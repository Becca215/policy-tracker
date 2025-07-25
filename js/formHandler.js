import { db } from './firebaseConfig.js';
import { collection, addDoc, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createAccordion } from './accordionRenderer.js';
import { selectedOffice } from './officeState.js';  // <-- Import selectedOffice

// Elements
const formCard = document.getElementById('formCard');
const policyForm = document.getElementById('policyForm');
const closeFormBtn = document.getElementById('closeFormBtn');

closeFormBtn.addEventListener('click', () => {
  formCard.classList.add('d-none');
  policyForm.reset();
  const companyInput = document.getElementById('companyName');
  companyInput.readOnly = false;
  companyInput.disabled = false;
  policyForm.dataset.office = "";  // Clear office when closing form
});

export function showForm(companyName = "", policy = null, office = "") {
  const companyInput = document.getElementById('companyName');
  const formCard = document.getElementById('formCard');
  const policyForm = document.getElementById('policyForm');

  // Save the office in the form dataset for later use in submit
  policyForm.dataset.office = office || "";

  if (policy) {
    // Editing an existing policy
    policyForm.dataset.editingId = policy.id;
    document.getElementById('clientFirstName').value = policy.clientFirstName || "";
    document.getElementById('clientLastName').value = policy.clientLastName || "";
    // Ensure dueDate is set as local YYYY-MM-DD string for input type="date"
    if (policy.dueDate) {
      // If already in YYYY-MM-DD, use as is; else convert
      let dateStr = policy.dueDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(dateStr);
        // Adjust for timezone offset to get local date
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dateStr = d.toISOString().slice(0, 10);
      }
      document.getElementById('dueDate').value = dateStr;
    } else {
      document.getElementById('dueDate').value = "";
    }

    document.getElementById('notes').value = policy.notes || "";
    document.getElementById('status').value = policy.status || "";
    document.getElementById('language').value = policy.language || "";
    document.getElementById('paymentPlan').value = policy.paymentPlan || "";

    companyInput.value = policy.companyName || "";
    companyInput.readOnly = true;
    companyInput.disabled = true;
    // If editing, override office dataset with existing policy office if you want:
    // policyForm.dataset.office = policy.office || office || "";
  } else {
    // Creating new
    policyForm.dataset.editingId = "";
    policyForm.reset();
    document.getElementById('paymentPlan').value = "";

    if (companyName) {
      companyInput.value = companyName;
      companyInput.readOnly = true;
      companyInput.disabled = true;
    } else {
      companyInput.value = "";
      companyInput.readOnly = false;
      companyInput.disabled = false;
    }
  }

  formCard.classList.remove('d-none');
}


// Handle form submit to add or update policy document
policyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientFirstName = document.getElementById('clientFirstName').value;
  const clientLastName = document.getElementById('clientLastName').value;
  const companyName = document.getElementById('companyName').value;
  // Always store dueDate as YYYY-MM-DD (local date string)
  let dueDate = document.getElementById('dueDate').value;
  // Defensive: if dueDate is not empty, ensure it's in YYYY-MM-DD
  if (dueDate) {
    // Already in YYYY-MM-DD from input type="date"
    // But if browser gives something else, convert
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      const d = new Date(dueDate);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dueDate = d.toISOString().slice(0, 10);
    }
  }
  const notes = document.getElementById('notes').value;
  const status = document.getElementById('status').value;
  const language = document.getElementById('language').value;
  const paymentPlan = document.getElementById('paymentPlan').value;

  const editingId = policyForm.dataset.editingId;
  const office = policyForm.dataset.office || selectedOffice();


  try {
    if (editingId) {
      // Editing an existing document
      const docRef = doc(db, "policies", editingId);
      await updateDoc(docRef, {
        clientFirstName,
        clientLastName,
        companyName,
        dueDate,
        notes,
        status,
        language,
        paymentPlan,
        officeNumber: office // Always update officeNumber for live UI update
      });
      // No alert; UI will update live and form will close
    } else {
      // Creating a new document
      await addDoc(collection(db, "policies"), {
        clientFirstName,
        clientLastName,
        companyName,
        dueDate,
        notes,
        status,
        language,
        paymentPlan,
        officeNumber: office, // Always save officeNumber for filtering
        text1SentAt: null,
        text2SentAt: null,
        text3SentAt: null,
        timestamp: new Date()
      });
      alert("Policy saved to Firestore!");
    }

    policyForm.reset();
    policyForm.dataset.office = ""; // Clear office after submit
    formCard.classList.add('d-none');
    // No manual refresh needed; Firestore listener will update the UI live
  } catch (error) {
    console.error("Error saving document: ", error);
    alert("Error saving data!");
  }
});

async function backfillOfficeNumber() {
  const snapshot = await getDocs(collection(db, "policies"));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.officeNumber) {
      const docRef = doc(db, "policies", docSnap.id);
      await updateDoc(docRef, {
        officeNumber: "215"
      });
      console.log(`✅ Updated ${docSnap.id} with officeNumber: 215`);
    }
  }

  console.log("🎉 Backfill complete.");
}

// Run this ONCE then delete or comment it out
// backfillOfficeNumber();

window.showForm = showForm;




