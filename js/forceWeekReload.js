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
      location.reload();
    });
  }
});
