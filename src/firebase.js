import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABH-5im2olPdLzwHTVmdiEqNygd0zhMbk",
  authDomain: "moneytracker-381e5.firebaseapp.com",
  projectId: "moneytracker-381e5",
  storageBucket: "moneytracker-381e5.firebasestorage.app",
  messagingSenderId: "598781564317",
  appId: "1:598781564317:web:a8a2d1a1d2da53510b8b74"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
