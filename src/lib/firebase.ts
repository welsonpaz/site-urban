import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, where 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Tipos e Interfaces
export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'auth';

export interface CustomerProfile {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  zipCode?: string;
  notes?: string;
  restaurantId?: string;
  ownerUid?: string;
  clientToken?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Utilitários exigidos pelos serviços
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

export async function getCustomers(restaurantId?: string): Promise<CustomerProfile[]> {
  try {
    const customersRef = collection(db, "customers");
    const target = restaurantId
      ? query(customersRef, where("restaurantId", "==", restaurantId))
      : customersRef;
    const querySnapshot = await getDocs(target);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerProfile));
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
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

// Funções de Cardápio / Itens
export async function getMenuItemsFromDB() {
  try {
    const querySnapshot = await getDocs(collection(db, "menu_items"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao buscar itens do menu:", error);
    return [];
  }
}

export async function saveMenuItemInDB(item: any) {
  try {
    const docRef = doc(collection(db, "menu_items"), item.id ? item.id : undefined);
    await setDoc(docRef, cleanData(item), { merge: true });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar item do menu:", error);
    return null;
  }
}

export async function deleteMenuItemInDB(id: string) {
  try {
    await deleteDoc(doc(db, "menu_items", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar item do menu:", error);
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
