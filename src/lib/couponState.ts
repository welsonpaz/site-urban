import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Coupon } from '../types';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'URBAN15',
    code: 'URBAN15',
    discount: 15,
    type: 'percent',
    description: '15% de desconto em todo o cardápio'
  },
  {
    id: 'SABOR7',
    code: 'SABOR7',
    discount: 15,
    type: 'percent',
    description: 'Desconto especial de inauguração'
  },
  {
    id: 'MONSTRO20',
    code: 'MONSTRO20',
    discount: 20,
    type: 'percent',
    description: '20% de desconto para fomes monstruosas'
  },
  {
    id: 'QUEROCOMER',
    code: 'QUEROCOMER',
    discount: 15,
    type: 'fixed',
    description: 'Desconto fixo de R$ 15,00'
  }
];

const COUPONS_STORAGE_KEY = 'urban_burguer_coupons_cache';

export function getCachedCoupons(): Coupon[] {
  try {
    const isInitialized = localStorage.getItem('coupons_initialized') === 'true';
    const cached = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (cached !== null) {
      return JSON.parse(cached);
    }
    return isInitialized ? [] : DEFAULT_COUPONS;
  } catch (e) {
    return DEFAULT_COUPONS;
  }
}

export async function fetchCouponsFromDB(): Promise<Coupon[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'coupons'));
    const list: Coupon[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Coupon;
      if (data && data.id) {
        list.push(data);
      }
    });

    if (list.length > 0) {
      localStorage.setItem('coupons_initialized', 'true');
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
      return list;
    }

    return getCachedCoupons();
  } catch (err) {
    console.error('Error loading coupons from DB:', err);
    return getCachedCoupons();
  }
}

export async function saveCouponToDB(coupon: Coupon): Promise<void> {
  try {
    const docRef = doc(db, 'coupons', coupon.id);
    const updated = {
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, updated, { merge: true });

    const metaRef = doc(db, 'coupons_meta', 'init');
    await setDoc(metaRef, { initialized: true }, { merge: true }).catch(() => {});

    // Refresh local cache
    const current = getCachedCoupons();
    const index = current.findIndex(c => c.id === coupon.id);
    if (index >= 0) {
      current[index] = updated;
    } else {
      current.push(updated);
    }
    localStorage.setItem('coupons_initialized', 'true');
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('coupons-updated'));
  } catch (err) {
    console.error('Error saving coupon to DB:', err);
    throw err;
  }
}

export async function deleteCouponFromDB(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'coupons', id);
    await deleteDoc(docRef);

    const metaRef = doc(db, 'coupons_meta', 'init');
    await setDoc(metaRef, { initialized: true }, { merge: true }).catch(() => {});

    // Refresh local cache
    const current = getCachedCoupons().filter(c => c.id !== id);
    localStorage.setItem('coupons_initialized', 'true');
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('coupons-updated'));
  } catch (err) {
    console.error('Error deleting coupon from DB:', err);
    throw err;
  }
}

export async function restoreDefaultCouponsInDB(): Promise<Coupon[]> {
  try {
    const metaRef = doc(db, 'coupons_meta', 'init');
    for (const coupon of DEFAULT_COUPONS) {
      const docRef = doc(db, 'coupons', coupon.id);
      await setDoc(docRef, { ...coupon, updatedAt: new Date().toISOString() });
    }
    await setDoc(metaRef, { initialized: true, updatedAt: new Date().toISOString() });
    localStorage.setItem('coupons_initialized', 'true');
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
    window.dispatchEvent(new Event('coupons-updated'));
    return DEFAULT_COUPONS;
  } catch (err) {
    console.error('Error restoring default coupons:', err);
    throw err;
  }
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(getCachedCoupons());
  const [loading, setLoading] = useState(true);

  const reloadCoupons = () => {
    fetchCouponsFromDB().then((dbCoupons) => {
      setCoupons(dbCoupons);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCoupons(getCachedCoupons());
    };
    window.addEventListener('coupons-updated', handleUpdate);

    reloadCoupons();

    return () => {
      window.removeEventListener('coupons-updated', handleUpdate);
    };
  }, []);

  return { coupons, loading, reloadCoupons };
}
