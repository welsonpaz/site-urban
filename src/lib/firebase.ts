import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword as fbSignIn } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração segura utilizando as variáveis do arquivo .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Utilitários de dados e tratamento de erros
export function cleanData(data: any) {
  if (!data) return data;
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export function handleFirestoreError(error: any, customMessage: string = 'Erro na operação') {
  console.error(`${customMessage}:`, error);
  return null;
}

// Função robusta de Login
export async function signInWithEmail(email: string, pass: string) {
  try {
    const userCredential = await fbSignIn(auth, email, pass);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Erro no Firebase Auth:', error.code, error.message);
    let message = 'E-mail ou senha incorretos no Firebase Auth.';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      message = 'E-mail ou senha inválidos. Verifique os dados informados.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Senha incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'E-mail com formato inválido.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Muitas tentativas falhas. Acesso temporariamente bloqueado.';
    }
    
    return { success: false, error: message };
  }
}

// Funções utilitárias de Produtos
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, 'Erro ao buscar produtos');
    return [];
  }
}

export async function saveMenuItemInDB(item: any) {
  try {
    const docRef = await addDoc(collection(db, 'products'), cleanData(item));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'Erro ao salvar produto');
    return null;
  }
}

export async function deleteMenuItemInDB(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, 'Erro ao excluir produto');
    return false;
  }
}

// Funções utilitárias de Clientes
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
    handleFirestoreError(error, 'Erro ao buscar cliente por telefone');
    return null;
  }
}

export async function saveCustomerProfile(phone: string, profileData: any) {
  try {
    const customerRef = doc(db, 'customers', phone.replace(/\D/g, ''));
    await setDoc(customerRef, cleanData({ ...profileData, updatedAt: new Date() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, 'Erro ao salvar perfil do cliente');
    return false;
  }
}
