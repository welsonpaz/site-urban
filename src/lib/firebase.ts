import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
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
export const storage = getStorage(app); // <- Esta linha corrige o erro de build no Super Admin e Admin

// Funções utilitárias do Firestore (caso já utilize no projeto)
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
