import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ Mantenha aqui as chaves de configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Funções utilitárias de Produtos
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function saveMenuItemInDB(item: any) {
  try {
    const docRef = await addDoc(collection(db, 'products'), item);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    return null;
  }
}

export async function deleteMenuItemInDB(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return false;
  }
}

// Funções utilitárias de Clientes (necessárias para o RegisterScreen)
export async function getCustomerByPhone(phone: string) {
  try {
    const q = query(collection(db, 'customers'), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      return { id: docData.id, ...docData.data() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    return null;
  }
}

export async function saveCustomerProfile(phone: string, profileData: any) {
  try {
    // Usamos o telefone como ID do documento ou salvamos com ID gerado
    const customerRef = doc(db, 'customers', phone.replace(/\D/g, ''));
    await setDoc(customerRef, { ...profileData, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao salvar perfil do cliente:', error);
    return false;
  }
}
