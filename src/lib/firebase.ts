import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANw6NSWZfm10e6WtAmHzHqU-v-6zTOx-I",
  authDomain: "urban-burguer-a9452.firebaseapp.com",
  projectId: "urban-burguer-a9452",
  storageBucket: "urban-burguer-a9452.firebasestorage.app",
  messagingSenderId: "548778960274",
  appId: "1:548778960274:web:3c76c795f9228a04ca4d4b",
  measurementId: "G-8T3BMRJWE9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
