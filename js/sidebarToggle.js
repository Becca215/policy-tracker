// Handles sidebar (office menu) minimize/expand
// Assumes sidebar has id="sidebar" and main content has id="mainContent"
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'sidebarToggleBtn';
  toggleBtn.className = 'btn btn-sm btn-outline-secondary mb-3';
  toggleBtn.style.width = '100%';
  toggleBtn.innerHTML = '<span id="sidebarToggleIcon">&laquo;</span> Minimize Menu';

  // Insert toggle button at top of sidebar
  sidebar.insertBefore(toggleBtn, sidebar.firstChild);

  let minimized = false;
  toggleBtn.addEventListener('click', function() {
    minimized = !minimized;
    if (minimized) {
      sidebar.style.width = '48px';
      sidebar.classList.add('sidebar-minimized');
      // Hide all except toggle
      Array.from(sidebar.children).forEach((child, i) => {
        if (i !== 0) child.style.display = 'none';
      });
      toggleBtn.innerHTML = '<span id="sidebarToggleIcon">&raquo;</span>';
      toggleBtn.title = 'Expand Menu';
    } else {
      sidebar.style.width = '200px';
      sidebar.classList.remove('sidebar-minimized');
      // Only show non-dropdown sections by default
      Array.from(sidebar.children).forEach(child => {
        // Keep Add Carrier and Delete Carriers hidden unless toggled
        if (child.id === 'addCarrierFormContainer' || child.id === 'carrierList') {
          // Do not show, let their toggle buttons control visibility
          return;
        }
        child.style.display = '';
      });
      toggleBtn.innerHTML = '<span id="sidebarToggleIcon">&laquo;</span> Minimize Menu';
      toggleBtn.title = 'Minimize Menu';
    }
  });
});
