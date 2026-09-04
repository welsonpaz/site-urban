import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, getDocs, collection, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { MenuItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDw2NpO_kWnoDTeKL5FM2S8EyLCZvz-aNg",
  authDomain: "idyllic-medium-fh7sp.firebaseapp.com",
  projectId: "idyllic-medium-fh7sp",
  storageBucket: "idyllic-medium-fh7sp.firebasestorage.app",
  messagingSenderId: "210627792206",
  appId: "1:210627792206:web:7e91d30b776dd3ef01a21f"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore instance using the named database ID from firebase-applet-config.json
// experimentalForceLongPolling ensures network stability in sandboxed iframes and proxies
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  "ai-studio-zestcuisine-1a62d94c-032a-43f6-aeb3-0cdaf0c1ef8b"
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface CustomerProfile {
  phone: string;
  name: string;
  cep: string;
  street: string;
  details: string;
  neighborhood: string;
  cityState: string;
  updatedAt: string;
}

// Error handling based on Firebase Integration Skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType | string, path: string | null = null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
    },
    operationType: operationType as OperationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Normalizes a phone number to digits-only for database storage/lookup
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Fetches a customer profile from Firestore by phone number
 */
export async function getCustomerByPhone(phone: string): Promise<CustomerProfile | null> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 10) return null;

  const path = `customers/${cleanPhone}`;
  try {
    const docRef = doc(db, 'customers', cleanPhone);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CustomerProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Recursively cleans an object to remove undefined fields which Firestore rejects
 */
export function cleanData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Saves or updates a customer profile in Firestore with clientToken and restaurantId scoping
 */
export async function saveCustomerProfile(
  profile: Omit<CustomerProfile, 'updatedAt'>,
  restaurantId?: string
): Promise<void> {
  const cleanPhone = normalizePhone(profile.phone);
  if (!cleanPhone || cleanPhone.length < 10) return;

  // Retrieve or generate persistent client secret token for this phone
  const tokenKey = `urban_cust_token_${cleanPhone}`;
  let clientToken = localStorage.getItem(tokenKey);
  if (!clientToken) {
    clientToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tok_${Date.now()}_${Math.random()}`;
    localStorage.setItem(tokenKey, clientToken);
  }

  // Cache customer profile in localStorage for local auto-fill without leaking PII
  const localProfile = {
    ...profile,
    phone: cleanPhone,
    restaurantId: restaurantId || 'urbanburguer',
    clientToken,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem('urban_customer_profile', JSON.stringify(localProfile));
  } catch {
    // Ignore storage quota errors
  }

  const path = `customers/${cleanPhone}`;
  try {
    const docRef = doc(db, 'customers', cleanPhone);
    const payload = cleanData({
      ...localProfile,
      ownerUid: auth.currentUser?.uid || undefined
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn('Sincronização de perfil na nuvem retida:', error);
  }
}

/**
 * Fetches registered customer profiles from Firestore (Tenant-scoped for managers, global for Super Admin)
 */
export async function getCustomers(restaurantId?: string): Promise<CustomerProfile[]> {
  const path = 'customers';
  try {
    let snap;
    if (restaurantId) {
      const q = query(collection(db, path), where('restaurantId', '==', restaurantId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(collection(db, path));
    }
    const list: CustomerProfile[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as CustomerProfile);
    });
    return list;
  } catch (error) {
    console.warn('Acesso a clientes restrito por política de segurança:', error);
    return [];
  }
}

/**
 * Fetches all dynamic menu items from Firestore
 */
export async function getMenuItemsFromDB(): Promise<MenuItem[]> {
  const path = 'menu_items';
  try {
    const snap = await getDocs(collection(db, path));
    const list: MenuItem[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as MenuItem);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves or updates a menu item in Firestore
 */
export async function saveMenuItemInDB(item: MenuItem): Promise<void> {
  const path = `menu_items/${item.id}`;
  try {
    const docRef = doc(db, 'menu_items', item.id);
    const payload = cleanData({
      ...item,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a menu item from Firestore
 */
export async function deleteMenuItemInDB(id: string): Promise<void> {
  const path = `menu_items/${id}`;
  try {
    const docRef = doc(db, 'menu_items', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
