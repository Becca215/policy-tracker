// This script forces a full page reload when the week is changed
window.addEventListener('DOMContentLoaded', () => {
  const weekInput = document.getElementById('weekStartInput');
  if (weekInput) {
    weekInput.addEventListener('change', () => {
      location.reload();
    });
  }
});
