// This script forces a full page reload when the week is changed
window.addEventListener('DOMContentLoaded', () => {
  const weekInput = document.getElementById('weekStartInput');
  if (weekInput) {
    // Show warning when user focuses or changes week
    const warning = document.getElementById('weekChangeWarning');
    weekInput.addEventListener('focus', () => {
      if (warning) warning.classList.remove('d-none');
    });
    weekInput.addEventListener('blur', () => {
      if (warning) warning.classList.add('d-none');
    });
    weekInput.addEventListener('change', () => {
      if (warning) warning.classList.add('d-none');
      // Only reload if a valid Monday is selected
      const val = weekInput.value;
      if (val) {
        const [year, month, day] = val.split('-').map(Number);
        const isMonday = new Date(year, month - 1, day).getDay() === 1;
        if (isMonday) {
          location.reload();
        }
      }
    });
  }
});
