import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';

/**
 * Perfil do usuário armazenado no Firestore.
 *
 * O Firebase Authentication controla:
 * - e-mail
 * - senha
 * - UID
 * - estado da conta
 *
 * O Firestore pode controlar:
 * - nome
 * - função
 * - estabelecimento
 * - permissões adicionais
 */
export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  establishmentId?: string;
  active?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Resultado completo do login.
 */
export interface AuthResult {
  user: User;
  profile: UserProfile | null;
}

/**
 * Login exclusivamente com e-mail e senha.
 *
 * Não existe cadastro público.
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Informe o e-mail.');
  }

  if (!password) {
    throw new Error('Informe a senha.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const user = credential.user;

    const profile = await getUserProfile(user.uid);

    return {
      user,
      profile,
    };
  } catch (error: any) {
    console.error('Erro ao realizar login:', error);

    switch (error?.code) {
      case 'auth/invalid-credential':
        throw new Error('E-mail ou senha inválidos.');

      case 'auth/user-not-found':
        throw new Error('E-mail ou senha inválidos.');

      case 'auth/wrong-password':
        throw new Error('E-mail ou senha inválidos.');

      case 'auth/invalid-email':
        throw new Error('O e-mail informado é inválido.');

      case 'auth/user-disabled':
        throw new Error('Esta conta está desativada.');

      case 'auth/too-many-requests':
        throw new Error(
          'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
        );

      case 'auth/network-request-failed':
        throw new Error(
          'Não foi possível conectar ao Firebase. Verifique sua internet.'
        );

      default:
        throw error;
    }
  }
}

/**
 * Faz logout do usuário atual.
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao realizar logout:', error);

    handleFirestoreError(
      error,
      OperationType.UPDATE,
      'authentication/logout'
    );
  }
}

/**
 * Retorna o usuário atualmente autenticado.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Observa alterações no estado de autenticação.
 */
export function onAuthChange(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Busca o perfil do usuário no Firestore.
 */
export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const path = `users/${uid}`;

  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      uid,
      ...(snapshot.data() as Omit<UserProfile, 'uid'>),
    };
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.READ,
      path
    );
  }
}

/**
 * Cria/atualiza somente o perfil do usuário no Firestore.
 *
 * ATENÇÃO:
 * Esta função NÃO cria uma conta no Firebase Authentication.
 *
 * A conta de autenticação deve existir previamente no
 * Firebase Authentication.
 */
export async function saveUserProfile(
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const path = `users/${uid}`;

  try {
    const userRef = doc(db, 'users', uid);

    await setDoc(
      userRef,
      {
        ...profile,
        uid,
        updatedAt: new Date(),
      },
      {
        merge: true,
      }
    );
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      path
    );
  }
}

/**
 * Verifica se existe usuário autenticado.
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Retorna o UID do usuário atual.
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

/**
 * Retorna o e-mail do usuário atual.
 */
export function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

/**
 * Verifica o papel/função do usuário.
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const profile = await getUserProfile(user.uid);

  return profile?.role ?? null;
}

/**
 * Verifica se o usuário possui uma determinada função.
 */
export async function hasRole(
  role: string
): Promise<boolean> {
  const currentRole = await getCurrentUserRole();

  return currentRole === role;
}

/**
 * Verifica se o usuário é administrador.
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();

  return (
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'restaurant_admin'
  );
}
