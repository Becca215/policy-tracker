// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOa-oNU3HjC3nkHvHKfTiGDP8zSd3cxJo",
  authDomain: "client-tracker-estrella.firebaseapp.com",
  projectId: "client-tracker-estrella",
  storageBucket: "client-tracker-estrella.firebasestorage.app",
  messagingSenderId: "481781270564",
  appId: "1:481781270564:web:cb99fdfe9e655924f9f0b1",
  measurementId: "G-FN9T8ZKTXD"
};

// Initialize Firebase app and Firestore DB
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
