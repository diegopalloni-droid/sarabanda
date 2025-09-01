
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials.
// You can find these in your Firebase project settings. See README.md for details.
const firebaseConfig = {
  apiKey: "AIzaSyASIhfwON6HCjoomz-POKRbiph4SXlO6x4",
  authDomain: "reportgiornalierostasera.firebaseapp.com",
  projectId: "reportgiornalierostasera",
  storageBucket: "reportgiornalierostasera.firebasestorage.app",
  messagingSenderId: "643034120993",
  appId: "1:643034120993:web:05c77b504e133e20303460"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, firebase };