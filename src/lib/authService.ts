import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, cleanData } from './firebase';

export type UserRole = 'super_admin' | 'restaurant_admin' | 'customer';

export interface CustomerAuthProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  cep?: string;
  street?: string;
  details?: string;
  neighborhood?: string;
  cityState?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  restaurantId?: string;
}

export const MASTER_SUPER_ADMIN_EMAIL = 'welsonpaz@gmail.com';

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function registerCustomer(
  email: string,
  password: string,
  data: Omit<CustomerAuthProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>
): Promise<CustomerAuthProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const phone = (data.phone || '').replace(/\D/g, '');
  if (!normalizedEmail || !password || !data.name?.trim() || !phone) {
    throw new Error('Preencha nome, e-mail, senha e telefone.');
  }

  const existingCustomer = await import('./firebase').then(m => m.getCustomerByPhone(phone));
  if (existingCustomer?.ownerUid && existingCustomer.ownerUid !== auth.currentUser?.uid) {
    throw new Error('Este telefone já está cadastrado para outro cliente.');
  }

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const user = credential.user;
  await updateProfile(user, { displayName: data.name.trim() });

  const now = new Date().toISOString();
  const profile: CustomerAuthProfile = {
    uid: user.uid,
    email: normalizedEmail,
    name: data.name.trim(),
    phone,
    cep: data.cep || '',
    street: data.street || '',
    details: data.details || '',
    neighborhood: data.neighborhood || '',
    cityState: data.cityState || '',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'customer_profiles', user.uid), cleanData(profile), { merge: true });
  await setDoc(doc(db, 'customers', phone), cleanData({
    ...data,
    uid: user.uid,
    ownerUid: user.uid,
    phone,
    email: normalizedEmail,
    name: data.name.trim(),
    createdAt: now,
    updatedAt: now,
  }), { merge: true });

  return profile;
}

export async function getCustomerAuthProfile(uid: string): Promise<CustomerAuthProfile | null> {
  const snap = await getDoc(doc(db, 'customer_profiles', uid));
  return snap.exists() ? (snap.data() as CustomerAuthProfile) : null;
}

export async function loginCustomer(email: string, password: string): Promise<{ user: User; profile: CustomerAuthProfile | null }> {
  const user = await loginWithEmail(email, password);
  const profile = await getCustomerAuthProfile(user.uid);
  return { user, profile };
}

export async function getUserProfile(user: User | null): Promise<AuthProfile | null> {
  if (!user) return null;

  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    let adminSnap = await getDoc(adminDocRef);
    const normalizedEmail = user.email?.toLowerCase().trim() || '';
    if (!adminSnap.exists() && normalizedEmail === MASTER_SUPER_ADMIN_EMAIL) {
      try {
        await setDoc(adminDocRef, {
          email: normalizedEmail,
          role: 'super_admin',
          name: user.displayName || 'WP Integrada Super Admin',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        adminSnap = await getDoc(adminDocRef);
      } catch {}
    }
    if (adminSnap.exists() && adminSnap.data()?.role === 'super_admin') {
      return { uid: user.uid, email: user.email, displayName: user.displayName || adminSnap.data()?.name || 'Super Admin', photoURL: user.photoURL, role: 'super_admin' };
    }
  } catch (err) {
    console.warn('Error checking admin doc:', err);
  }

  try {
    const restAdminSnap = await getDoc(doc(db, 'restaurant_admins', user.uid));
    if (restAdminSnap.exists() && restAdminSnap.data()?.role === 'restaurant_admin') {
      const data = restAdminSnap.data();
      return { uid: user.uid, email: user.email, displayName: user.displayName || 'Gerente do Restaurante', photoURL: user.photoURL, role: 'restaurant_admin', restaurantId: data.restaurantId };
    }
  } catch (err) {
    console.warn('Error checking restaurant_admin doc:', err);
  }

  return { uid: user.uid, email: user.email, displayName: user.displayName || 'Cliente', photoURL: user.photoURL, role: 'customer' };
}

export async function assignRestaurantAdminRole(uid: string, email: string, restaurantId: string): Promise<void> {
  await setDoc(doc(db, 'restaurant_admins', uid), { email: email.toLowerCase().trim(), role: 'restaurant_admin', restaurantId, updatedAt: new Date().toISOString() });
}

export async function revokeRestaurantAdminRole(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'restaurant_admins', uid));
}

export function subscribeToAuthState(callback: (profile: AuthProfile | null, user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) { callback(null, null); return; }
    const profile = await getUserProfile(user);
    callback(profile, user);
  });
}
