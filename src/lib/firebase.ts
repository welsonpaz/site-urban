import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicialização
const app = initializeApp(firebaseConfig);

// Serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// Tipos de operação utilizados pelo tratamento de erros
export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

// Tratamento centralizado de erros do Firestore
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string
): never {
  console.error('Firestore error:', {
    operationType,
    path,
    error,
  });

  throw error;
}

export default app;
