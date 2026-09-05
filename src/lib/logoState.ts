import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_LOGO_URL } from '../data';

export interface BrandingSettings {
  name: string;
  subtitle: string;
  tag: string;
  logoUrl: string;
  openingTime: string;
  closingTime: string;
  daysText: string;
  statusMode: 'auto' | 'open' | 'closed';
  openDays: number[];
}

export const BRANDING_STORAGE_KEY = 'urban_burguer_branding';

export const DEFAULT_BRANDING: BrandingSettings = {
  name: 'Urban Burguer',
  subtitle: 'O Verdadeiro Sabor do Fogo',
  tag: 'Artesanal',
  logoUrl: MOCK_LOGO_URL,
  openingTime: '18:00',
  closingTime: '23:30',
  daysText: 'Terça a Domingo',
  statusMode: 'auto',
  openDays: [0, 2, 3, 4, 5, 6],
};

export function isStoreOpen(branding?: Partial<BrandingSettings> | null): { isOpen: boolean; reason: string; detail: string } {
  if (!branding) {
    return {
      isOpen: true,
      reason: 'Aberto agora',
      detail: 'Horário padrão'
    };
  }

  if (branding.statusMode === 'open') {
    return {
      isOpen: true,
      reason: 'Aberto agora (Forçado)',
      detail: `${branding.openingTime || '18:00'} às ${branding.closingTime || '23:30'} (${branding.daysText || 'Todos os dias'})`
    };
  }
  if (branding.statusMode === 'closed') {
    return {
      isOpen: false,
      reason: 'Fechado agora (Forçado)',
      detail: `Horário: ${branding.openingTime || '18:00'} às ${branding.closingTime || '23:30'} (${branding.daysText || 'Todos os dias'})`
    };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  const openDays = branding.openDays && branding.openDays.length > 0 
    ? branding.openDays 
    : [0, 2, 3, 4, 5, 6];

  const daysText = branding.daysText || 'Terça a Domingo';
  const openTime = branding.openingTime || '18:00';
  const closeTime = branding.closingTime || '23:30';

  if (!openDays.includes(currentDay)) {
    return {
      isOpen: false,
      reason: 'Fechado hoje',
      detail: `Funcionamento: ${daysText} (${openTime} às ${closeTime})`
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openTime.split(':').map(Number);
  const openMinutes = (openH || 0) * 60 + (openM || 0);

  const [closeH, closeM] = closeTime.split(':').map(Number);
  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

  let open = false;
  if (closeMinutes >= openMinutes) {
    open = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Overnight e.g. 18:00 to 02:00
    open = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  if (open) {
    return {
      isOpen: true,
      reason: 'Aberto agora',
      detail: `Fecha às ${closeTime} (${daysText})`
    };
  } else {
    return {
      isOpen: false,
      reason: 'Fechado no momento',
      detail: `Abre às ${openTime} (${daysText})`
    };
  }
}

export function getCachedBranding(): BrandingSettings {
  try {
    const cached = localStorage.getItem(BRANDING_STORAGE_KEY);
    return cached ? { ...DEFAULT_BRANDING, ...JSON.parse(cached) } : DEFAULT_BRANDING;
  } catch (e) {
    return DEFAULT_BRANDING;
  }
}

export async function fetchBrandingFromDB(): Promise<BrandingSettings> {
  try {
    const docRef = doc(db, 'settings', 'branding');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const loaded: BrandingSettings = {
        name: data.name || DEFAULT_BRANDING.name,
        subtitle: data.subtitle || DEFAULT_BRANDING.subtitle,
        tag: data.tag || DEFAULT_BRANDING.tag,
        logoUrl: data.logoUrl || data.url || DEFAULT_BRANDING.logoUrl,
        openingTime: data.openingTime || DEFAULT_BRANDING.openingTime,
        closingTime: data.closingTime || DEFAULT_BRANDING.closingTime,
        daysText: data.daysText || DEFAULT_BRANDING.daysText,
        statusMode: data.statusMode || DEFAULT_BRANDING.statusMode,
        openDays: Array.isArray(data.openDays) ? data.openDays : DEFAULT_BRANDING.openDays,
      };
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(loaded));
      return loaded;
    } else {
      // Seed initial branding settings in DB
      await setDoc(docRef, { ...DEFAULT_BRANDING, updatedAt: new Date().toISOString() });
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(DEFAULT_BRANDING));
      return DEFAULT_BRANDING;
    }
  } catch (err) {
    console.error('Error loading branding from DB:', err);
  }
  return getCachedBranding();
}

export async function saveBrandingToDB(settings: Partial<BrandingSettings>): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'branding');
    const current = getCachedBranding();
    const updated = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, updated, { merge: true });
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch events to notify listeners
    window.dispatchEvent(new Event('branding-updated'));
    window.dispatchEvent(new Event('logo-updated'));
  } catch (err) {
    console.error('Error saving branding to DB:', err);
    throw err;
  }
}

export async function deleteLogoFromDB(): Promise<void> {
  try {
    await saveBrandingToDB({ logoUrl: DEFAULT_BRANDING.logoUrl });
  } catch (err) {
    console.error('Error deleting logo from DB:', err);
    throw err;
  }
}

export async function saveLogoToDB(url: string): Promise<void> {
  try {
    await saveBrandingToDB({ logoUrl: url });
  } catch (err) {
    console.error('Error saving logo to DB:', err);
    throw err;
  }
}

export function useLogo() {
  const [logo, setLogo] = useState(getCachedBranding().logoUrl);

  useEffect(() => {
    const handleUpdate = () => {
      setLogo(getCachedBranding().logoUrl);
    };
    window.addEventListener('logo-updated', handleUpdate);

    fetchBrandingFromDB().then((dbBranding) => {
      if (dbBranding && dbBranding.logoUrl !== logo) {
        setLogo(dbBranding.logoUrl);
      }
    });

    return () => {
      window.removeEventListener('logo-updated', handleUpdate);
    };
  }, []);

  return logo;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(getCachedBranding());

  useEffect(() => {
    const handleUpdate = () => {
      setBranding(getCachedBranding());
    };
    window.addEventListener('branding-updated', handleUpdate);

    fetchBrandingFromDB().then((dbBranding) => {
      if (dbBranding) {
        setBranding(dbBranding);
      }
    });

    return () => {
      window.removeEventListener('branding-updated', handleUpdate);
    };
  }, []);

  return branding;
}
