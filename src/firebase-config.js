// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAe1CKwq4uFhEtMsYQlbyo3T1QYyRpZeDM",
  authDomain: "chatapp-1a14e.firebaseapp.com",
  projectId: "chatapp-1a14e",
  storageBucket: "chatapp-1a14e.firebasestorage.app",
  messagingSenderId: "733156493745",
  appId: "1:733156493745:web:86406e5b0a1e20cd319590",
  measurementId: "G-5XCBTWBT8H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firestore with custom settings
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add error handling for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
  } else {
    console.log('User is signed out');
  }
});

export { auth, db, provider };
