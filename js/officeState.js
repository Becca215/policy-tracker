// Persistent office selection using localStorage
const OFFICE_KEY = 'selectedOffice';
let currentOffice = localStorage.getItem(OFFICE_KEY) || "215";

function setOffice(office) {
  currentOffice = office;
  localStorage.setItem(OFFICE_KEY, office);
}

function selectedOffice() {
  return currentOffice;
}

export { setOffice, selectedOffice };
