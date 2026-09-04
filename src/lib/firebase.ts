import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, doc, getDoc, setDoc, collection, getDocs 
} from "firebase/firestore";

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

// Funções utilitárias exigidas pelo tenantService.ts
export function cleanData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

export function handleFirestoreError(error: any, operation: string) {
  console.error(`Erro no Firestore durante [${operation}]:`, error);
  throw error;
}

// Funções de Clientes
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
    await setDoc(docRef, cleanData(data), { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar perfil do cliente:", error);
    return false;
  }
}

// Funções de Restaurante / Configurações
export async function getRestaurantData() {
  try {
    const docRef = doc(db, "settings", "restaurant");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar restaurante:", error);
    return null;
  }
}

export async function updateRestaurantData(data: any) {
  try {
    const docRef = doc(db, "settings", "restaurant");
    await setDoc(docRef, cleanData(data), { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar restaurante:", error);
    return false;
  }
}

// Funções de Produtos / Pedidos
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

export async function saveOrder(orderData: any) {
  try {
    const orderRef = doc(collection(db, "orders"));
    await setDoc(orderRef, cleanData({ ...orderData, createdAt: new Date().toISOString() }));
    return orderRef.id;
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    return null;
  }
}

export default app;
