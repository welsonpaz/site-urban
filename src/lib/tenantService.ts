import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, cleanData } from './firebase';
import { Restaurant, MenuItem, AdditionalOption, Order, OrderStatus } from '../types';
import { DEFAULT_RESTAURANTS, PIZZARIA_ITEMS, DEFAULT_ADDITIONALS } from './defaultRestaurants';
import { MENU_ITEMS } from '../data';

const RESTAURANTS_COLLECTION = 'restaurants';
const MENU_ITEMS_COLLECTION = 'menu_items';
const ADDITIONALS_COLLECTION = 'additionals';
const ORDERS_COLLECTION = 'orders';

const ACTIVE_TENANT_KEY = 'wp_active_restaurant_slug';

// Extract current slug from window.location or localStorage
export function getCurrentSlug(): string {
  try {
    // 1. URL Path: /cardapio/:slug or /:slug
    const pathname = window.location.pathname;
    const cardapioMatch = pathname.match(/\/cardapio\/([a-zA-Z0-9_-]+)/i);
    if (cardapioMatch && cardapioMatch[1]) {
      return cardapioMatch[1].toLowerCase();
    }

    // 2. Query param: ?slug=xyz or ?rest=xyz
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('slug') || urlParams.get('rest') || urlParams.get('r');
    if (paramSlug) {
      return paramSlug.toLowerCase();
    }

    // 3. Hash: #/cardapio/:slug or #:slug
    const hash = window.location.hash;
    const hashMatch = hash.match(/cardapio\/([a-zA-Z0-9_-]+)/i);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1].toLowerCase();
    }

    // 4. Stored active slug in localStorage
    const saved = localStorage.getItem(ACTIVE_TENANT_KEY);
    if (saved) {
      return saved.toLowerCase();
    }
  } catch (err) {
    console.error('Erro ao detectar slug:', err);
  }

  // Default fallback is 'urbanburguer'
  return 'urbanburguer';
}

export function setActiveSlug(slug: string): void {
  try {
    localStorage.setItem(ACTIVE_TENANT_KEY, slug.toLowerCase());
    // Update URL without page reload
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('slug', slug.toLowerCase());
    window.history.pushState({}, '', currentUrl.toString());
    window.dispatchEvent(new CustomEvent('tenant-changed', { detail: { slug } }));
  } catch (e) {
    console.error(e);
  }
}

// Ensure default restaurants are seeded into Firestore
export async function initializeTenantsInDB(): Promise<Restaurant[]> {
  try {
    const snap = await getDocs(collection(db, RESTAURANTS_COLLECTION));
    const loadedList: Restaurant[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as Restaurant;
      if (data && data.id) {
        loadedList.push(data);
      }
    });

    // Check if Urbano Burguer or Pizzaria Teste are missing
    let shouldSyncItems = false;
    for (const defRest of DEFAULT_RESTAURANTS) {
      const exists = loadedList.some((r) => r.id === defRest.id || r.slug === defRest.slug);
      if (!exists) {
        try {
          const docRef = doc(db, RESTAURANTS_COLLECTION, defRest.id);
          await setDoc(docRef, cleanData(defRest));
          loadedList.push(defRest);
          shouldSyncItems = true;
        } catch {
          // If write is restricted (e.g. unauthenticated), keep in memory
          loadedList.push(defRest);
        }
      }
    }

    // Seed products for default restaurants if needed
    if (shouldSyncItems && loadedList.length <= 2) {
      try {
        // Check menu items
        const itemsSnap = await getDocs(collection(db, MENU_ITEMS_COLLECTION));
        const hasUrbanItems = itemsSnap.docs.some((d) => d.data().restaurantId === 'urbanburguer');
        const hasPizzaItems = itemsSnap.docs.some((d) => d.data().restaurantId === 'pizzariateste');

        if (!hasUrbanItems) {
          for (const item of MENU_ITEMS) {
            const docRef = doc(db, MENU_ITEMS_COLLECTION, `urban-${item.id}`);
            await setDoc(docRef, cleanData({
              ...item,
              id: `urban-${item.id}`,
              restaurantId: 'urbanburguer',
              isActive: true,
              updatedAt: new Date().toISOString()
            }));
          }
        }

        if (!hasPizzaItems) {
          for (const item of PIZZARIA_ITEMS) {
            const docRef = doc(db, MENU_ITEMS_COLLECTION, item.id);
            await setDoc(docRef, cleanData({
              ...item,
              isActive: true,
              updatedAt: new Date().toISOString()
            }));
          }
        }

        // Check additionals
        const addSnap = await getDocs(collection(db, ADDITIONALS_COLLECTION));
        if (addSnap.empty) {
          for (const add of DEFAULT_ADDITIONALS) {
            const docRef = doc(db, ADDITIONALS_COLLECTION, add.id);
            await setDoc(docRef, cleanData(add));
          }
        }
      } catch {
        // Ignore seed errors if non-admin
      }
    }

    return loadedList.length > 0 ? loadedList : DEFAULT_RESTAURANTS;
  } catch (err) {
    console.error('Erro ao inicializar tenants no Firestore:', err);
    return DEFAULT_RESTAURANTS;
  }
}

// Fetch all restaurants (for Super Admin)
export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const snap = await getDocs(collection(db, RESTAURANTS_COLLECTION));
    const list: Restaurant[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Restaurant;
      if (data && data.id) {
        list.push(data);
      }
    });

    if (list.length === 0) {
      return await initializeTenantsInDB();
    }
    return list;
  } catch (err) {
    console.warn('Não foi possível carregar restaurantes da nuvem, utilizando predefinições locais:', err);
    return DEFAULT_RESTAURANTS;
  }
}

// Get restaurant by ID or Slug
export async function getRestaurantBySlugOrId(slugOrId: string): Promise<Restaurant | null> {
  const clean = slugOrId.toLowerCase().trim();
  try {
    // 1. Direct doc lookup by ID
    const docRef = doc(db, RESTAURANTS_COLLECTION, clean);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Restaurant;
    }

    // 2. Query by slug
    const q = query(collection(db, RESTAURANTS_COLLECTION), where('slug', '==', clean));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as Restaurant;
    }

    // Fallback to local default restaurants if offline / initial
    const found = DEFAULT_RESTAURANTS.find((r) => r.slug === clean || r.id === clean);
    return found || null;
  } catch (err) {
    console.error('Erro ao buscar restaurante por slug:', err);
    const found = DEFAULT_RESTAURANTS.find((r) => r.slug === clean || r.id === clean);
    return found || null;
  }
}

// Save or Update a restaurant
export async function saveRestaurantToDB(restaurant: Restaurant): Promise<void> {
  try {
    const docRef = doc(db, RESTAURANTS_COLLECTION, restaurant.id);
    const payload = cleanData({
      ...restaurant,
      slug: restaurant.slug.toLowerCase().trim(),
      updatedAt: new Date().toISOString()
    }) as Restaurant;
    await setDoc(docRef, payload, { merge: true });
    window.dispatchEvent(new CustomEvent('restaurant-updated', { detail: { restaurant: payload } }));
  } catch (err) {
    handleFirestoreError(err, 'salvar restaurante');
    throw err;
  }
}

// Delete a restaurant
export async function deleteRestaurantFromDB(id: string): Promise<void> {
  try {
    const docRef = doc(db, RESTAURANTS_COLLECTION, id);
    await deleteDoc(docRef);
    window.dispatchEvent(new CustomEvent('restaurant-deleted', { detail: { id } }));
  } catch (err) {
    handleFirestoreError(err, 'excluir restaurante');
    throw err;
  }
}

// MENU ITEMS BY RESTAURANT
export async function getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
  try {
    const snap = await getDocs(collection(db, MENU_ITEMS_COLLECTION));
    const list: MenuItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as MenuItem;
      // If item has restaurantId matching, or if it's default burger items belonging to urbanburguer
      if (data.restaurantId === restaurantId) {
        list.push(data);
      } else if (!data.restaurantId && restaurantId === 'urbanburguer') {
        list.push({ ...data, restaurantId: 'urbanburguer' });
      }
    });

    if (list.length === 0) {
      if (restaurantId === 'pizzariateste') {
        return PIZZARIA_ITEMS;
      }
      if (restaurantId === 'urbanburguer') {
        return MENU_ITEMS.map(m => ({ ...m, restaurantId: 'urbanburguer' }));
      }
    }
    return list;
  } catch (err) {
    console.error('Erro ao carregar cardápio do restaurante:', err);
    if (restaurantId === 'pizzariateste') return PIZZARIA_ITEMS;
    return MENU_ITEMS.map(m => ({ ...m, restaurantId: 'urbanburguer' }));
  }
}

// Save Menu Item scoped to restaurant
export async function saveMenuItemForRestaurant(item: MenuItem, restaurantId: string): Promise<void> {
  try {
    const id = item.id || `item-${Date.now()}`;
    const docRef = doc(db, MENU_ITEMS_COLLECTION, id);
    const payload = cleanData({
      ...item,
      id,
      restaurantId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, payload, { merge: true });
    window.dispatchEvent(new Event('menu-updated'));
  } catch (err) {
    handleFirestoreError(err, 'salvar item do cardápio');
    throw err;
  }
}

// Delete Menu Item
export async function deleteMenuItemForRestaurant(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
    window.dispatchEvent(new Event('menu-updated'));
  } catch (err) {
    handleFirestoreError(err, 'remover item do cardápio');
    throw err;
  }
}

// ADDITIONALS BY RESTAURANT
export async function getAdditionalsByRestaurant(restaurantId: string): Promise<AdditionalOption[]> {
  try {
    const snap = await getDocs(collection(db, ADDITIONALS_COLLECTION));
    const list: AdditionalOption[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AdditionalOption;
      if (data.restaurantId === restaurantId) {
        list.push(data);
      }
    });

    if (list.length === 0) {
      const defaults = DEFAULT_ADDITIONALS.filter(a => a.restaurantId === restaurantId);
      return defaults;
    }
    return list;
  } catch (err) {
    console.error('Erro ao buscar adicionais:', err);
    return DEFAULT_ADDITIONALS.filter(a => a.restaurantId === restaurantId);
  }
}

export async function saveAdditionalForRestaurant(additional: AdditionalOption): Promise<void> {
  try {
    const id = additional.id || `add-${Date.now()}`;
    const docRef = doc(db, ADDITIONALS_COLLECTION, id);
    const payload = cleanData({ ...additional, id, updatedAt: new Date().toISOString() });
    await setDoc(docRef, payload, { merge: true });
    window.dispatchEvent(new Event('additionals-updated'));
  } catch (err) {
    handleFirestoreError(err, 'salvar adicional');
    throw err;
  }
}

export async function deleteAdditionalForRestaurant(id: string): Promise<void> {
  try {
    const docRef = doc(db, ADDITIONALS_COLLECTION, id);
    await deleteDoc(docRef);
    window.dispatchEvent(new Event('additionals-updated'));
  } catch (err) {
    handleFirestoreError(err, 'remover adicional');
    throw err;
  }
}

// ORDERS PERSISTENCE BY RESTAURANT
export async function saveOrderToDB(order: Order, restaurantId: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const payload = cleanData({
      ...order,
      restaurantId,
      createdAt: order.createdAt || new Date().toISOString()
    });
    await setDoc(docRef, payload);
    window.dispatchEvent(new Event('orders-updated'));
  } catch (err) {
    handleFirestoreError(err, 'salvar pedido');
    throw err;
  }
}

export async function getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), where('restaurantId', '==', restaurantId));
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      list.push(data);
    });
    // Sort newest first
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    return list;
  } catch (err) {
    console.error('Erro ao buscar pedidos do restaurante:', err);
    return [];
  }
}

export async function updateOrderStatusInDB(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const payload = cleanData({ status, updatedAt: new Date().toISOString() });
    await setDoc(docRef, payload, { merge: true });
    window.dispatchEvent(new Event('orders-updated'));
  } catch (err) {
    handleFirestoreError(err, 'atualizar status do pedido');
    throw err;
  }
}

// Aliases for convenient importing
export const getRestaurantsFromDB = getAllRestaurants;
export const getMenuItemsForRestaurant = getMenuItemsByRestaurant;
export const saveRestaurantInDB = saveRestaurantToDB;

