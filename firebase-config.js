// Firebase 기본 설정
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIZLw-LTK98w5TejTgQOrma2TwhuXXUag",
  authDomain: "memo-e8811.firebaseapp.com",
  projectId: "memo-e8811",
  storageBucket: "memo-e8811.firebasestorage.app",
  messagingSenderId: "325985494842",
  appId: "1:325985494842:web:1626597886a4cfc20f9203"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 