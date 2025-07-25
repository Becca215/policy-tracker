// presence.js
// Tracks and displays the number of active users on the site using Firestore
import { db } from './firebaseConfig.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Generate a unique session ID for this tab
function getSessionId() {
  if (!window._presenceSessionId) {
    window._presenceSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return window._presenceSessionId;
}

// Add or update this user in the presence collection (heartbeat)
async function addPresence() {
  const sessionId = getSessionId();
  const ref = doc(collection(db, 'presence'), sessionId);
  await setDoc(ref, {
    timestamp: Date.now(),
    userAgent: navigator.userAgent || '',
  });
}

// Heartbeat: update timestamp every 10 seconds
let heartbeatInterval = null;
function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    addPresence();
  }, 10000); // 10 seconds
}
function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

// Remove this user from the presence collection
async function removePresence() {
  const sessionId = getSessionId();
  const ref = doc(collection(db, 'presence'), sessionId);
  await deleteDoc(ref);
}

// Listen for changes and update the UI
function listenPresence() {
  const badgeId = 'activeUsersBadge';
  let badge = document.getElementById(badgeId);
  if (!badge) {
    // Place badge in the center of the navbar, between brand and toggler/collapse
    const container = document.querySelector('.navbar .container');
    const brand = container ? container.querySelector('.navbar-brand') : null;
    const toggler = container ? container.querySelector('.navbar-toggler') : null;
    if (container && brand && toggler) {
      // Remove any existing badge
      const oldBadge = document.getElementById(badgeId);
      if (oldBadge && oldBadge.parentElement) oldBadge.parentElement.remove();
      badge = document.createElement('span');
      badge.id = badgeId;
      badge.className = 'badge bg-primary text-white ms-2';
      badge.textContent = 'Active: 1';
      badge.style.alignSelf = 'center';
      badge.style.fontSize = '1em';
      badge.style.marginLeft = '16px';
      badge.style.marginRight = '16px';
      // Insert badge after brand, before toggler
      if (brand.nextSibling) {
        container.insertBefore(badge, toggler);
      } else {
        container.appendChild(badge);
      }
    }
  }
  const presenceCol = collection(db, 'presence');
  onSnapshot(presenceCol, (snapshot) => {
    const now = Date.now();
    // Only count users with timestamp within last 30 seconds
    const active = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.timestamp && now - data.timestamp < 30000;
    });
    if (badge) badge.textContent = `Active: ${active.length}`;
  });
}

// Setup presence on load and cleanup on unload
window.addEventListener('DOMContentLoaded', () => {
  addPresence();
  startHeartbeat();
  listenPresence();
});
window.addEventListener('beforeunload', () => {
  stopHeartbeat();
  removePresence();
});
