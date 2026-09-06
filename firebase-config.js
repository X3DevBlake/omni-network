import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { initializeFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyDkNqTMPrHvgz0O-4OLd5E_nMOPoMZqOa0",
  authDomain: "omni-network-39821.firebaseapp.com",
  projectId: "omni-network-39821",
  storageBucket: "omni-network-39821.firebasestorage.app",
  messagingSenderId: "1036007047880",
  appId: "1:1036007047880:web:db88f8d8a8fe8eef4b1bfd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const dbPresale = initializeFirestore(app, {}, "omni-dao");
export const dbDao = initializeFirestore(app, {}, "omni-dao");
