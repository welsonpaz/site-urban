import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';

export type UserRole = 'super_admin' | 'restaurant_admin' | 'customer';

export interface AuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  restaurantId?: string; // Set when role === 'restaurant_admin'
}

// Fixed platform owner email allowed to bootstrap
export const MASTER_SUPER_ADMIN_EMAIL = 'welsonpaz@gmail.com';

/**
 * Login with Google popup (standard Firebase Auth)
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error) {
    console.error('Email Sign-In failed:', error);
    throw error;
  }
}

/**
 * Register a new user with email and password
 */
export async function registerWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error) {
    console.error('Email Registration failed:', error);
    throw error;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out failed:', error);
    throw error;
  }
}

/**
 * Resolves the authenticated user's role and tenant authorization purely based on
 * Firebase Authentication and Firestore RBAC documents (admins/{uid}, restaurant_admins/{uid}).
 */
export async function getUserProfile(user: User | null): Promise<AuthProfile | null> {
  if (!user) return null;

  // 1. Check if user is registered in Firestore /admins
  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    let adminSnap = await getDoc(adminDocRef);

    // If doc does not exist, attempt bootstrap sync permitted by Firestore security rules
    if (!adminSnap.exists()) {
      try {
        await setDoc(adminDocRef, {
          email: user.email?.toLowerCase().trim() || '',
          role: 'super_admin',
          name: user.displayName || 'WP Internet Super Admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        adminSnap = await getDoc(adminDocRef);
      } catch {
        // Ignored if rules disallow creation for non-authorized user
      }
    }

    if (adminSnap.exists() && adminSnap.data()?.role === 'super_admin') {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || adminSnap.data()?.name || 'Super Admin',
        photoURL: user.photoURL,
        role: 'super_admin'
      };
    }
  } catch (err) {
    console.warn('Error checking admin doc:', err);
  }

  // 2. Check if user is registered in Firestore /restaurant_admins
  try {
    const restAdminDocRef = doc(db, 'restaurant_admins', user.uid);
    const restAdminSnap = await getDoc(restAdminDocRef);
    if (restAdminSnap.exists() && restAdminSnap.data()?.role === 'restaurant_admin') {
      const data = restAdminSnap.data();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Gerente do Restaurante',
        photoURL: user.photoURL,
        role: 'restaurant_admin',
        restaurantId: data?.restaurantId
      };
    }
  } catch (err) {
    console.warn('Error checking restaurant_admin doc:', err);
  }

  // 3. Default: standard customer
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Cliente',
    photoURL: user.photoURL,
    role: 'customer'
  };
}

/**
 * Assigns a user as manager for a restaurant (callable by Super Admin only)
 */
export async function assignRestaurantAdminRole(uid: string, email: string, restaurantId: string): Promise<void> {
  const docRef = doc(db, 'restaurant_admins', uid);
  await setDoc(docRef, {
    email: email.toLowerCase().trim(),
    role: 'restaurant_admin',
    restaurantId,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Revokes restaurant admin role (callable by Super Admin only)
 */
export async function revokeRestaurantAdminRole(uid: string): Promise<void> {
  const docRef = doc(db, 'restaurant_admins', uid);
  await deleteDoc(docRef);
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function subscribeToAuthState(callback: (profile: AuthProfile | null, user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }
    const profile = await getUserProfile(user);
    callback(profile, user);
  });
}
