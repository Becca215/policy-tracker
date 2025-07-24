let currentOffice = "215";

function setOffice(office) {
  currentOffice = office;
}

function selectedOffice() {
  return currentOffice;
}

export { setOffice, selectedOffice };
