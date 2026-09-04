import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

// Funções utilitárias do cliente exigidas pelo RegisterScreen.tsx
export async function getCustomerByPhone(phone: string) {
  try {
    const docRef = doc(db, "customers", phone);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return null;
  }
}

export async function saveCustomerProfile(phone: string, data: any) {
  try {
    const docRef = doc(db, "customers", phone);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar perfil do cliente:", error);
    return false;
  }
}

export default app;
