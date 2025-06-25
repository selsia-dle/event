// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIZLw-LTK98w5TejTgQOrma2TwhuXXUag",
  authDomain: "memo-e8811.firebaseapp.com",
  projectId: "memo-e8811",
  storageBucket: "memo-e8811.appspot.com",
  messagingSenderId: "325985494842",
  appId: "1:325985494842:web:1626597886a4cfc20f9203"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 