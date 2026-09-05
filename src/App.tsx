/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, ScreenType, Order, UserAddress, Restaurant } from './types';
import { MENU_ITEMS } from './data';
import { Flame, ReceiptText, Heart, User, ShoppingBag } from 'lucide-react';
import MenuScreen from './components/MenuScreen';
import DetailScreen from './components/DetailScreen';
import CartScreen from './components/CartScreen';
import RegisterScreen from './components/RegisterScreen';
import CheckoutScreen from './components/CheckoutScreen';
import OrdersList from './components/OrdersList';
import FavoriteScreen from './components/FavoriteScreen';
import ProfileScreen from './components/ProfileScreen';
import DashboardScreen from './components/DashboardScreen';
import SuperAdminScreen from './components/SuperAdminScreen';
import Footer from './components/Footer';
import { useLogo, useBranding } from './lib/logoState';
import { getRestaurantsFromDB, getMenuItemsForRestaurant } from './lib/tenantService';
import { DEFAULT_RESTAURANTS } from './lib/defaultRestaurants';

export default function App() {
  const defaultLogo = useLogo();
  const defaultBranding = useBranding();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  // Multi-Tenant Restaurant States
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS);
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant>(DEFAULT_RESTAURANTS[0]);

  const logo = activeRestaurant?.logoUrl || defaultLogo;
  const branding = activeRestaurant ? {
    name: activeRestaurant.name,
    subtitle: activeRestaurant.subtitle || '',
    tag: activeRestaurant.tag || '',
  } : defaultBranding;

  // Initialize tenants and detect URL slug on mount
  useEffect(() => {
    const initTenants = async () => {
      try {
        const dbTenants = await getRestaurantsFromDB();
        if (dbTenants && dbTenants.length > 0) {
          setRestaurants(dbTenants);

          const path = window.location.pathname;
          const match = path.match(/\/cardapio\/([a-zA-Z0-9_-]+)/);
          const savedSlug = localStorage.getItem('wp_active_restaurant_slug');
          const targetSlug = match ? match[1] : savedSlug;

          let chosen = dbTenants[0];
          if (targetSlug) {
            const found = dbTenants.find(t => t.slug.toLowerCase() === targetSlug.toLowerCase());
            if (found) chosen = found;
          }
          setActiveRestaurant(chosen);
          localStorage.setItem('wp_active_restaurant_slug', chosen.slug);
        }
      } catch (err) {
        console.error('Erro ao inicializar estabelecimentos:', err);
      }
    };
    initTenants();
  }, []);

  // Handler to switch tenant cleanly
  const handleSelectRestaurant = (rest: Restaurant) => {
    setActiveRestaurant(rest);
    localStorage.setItem('wp_active_restaurant_slug', rest.slug);
    try {
      window.history.replaceState({}, '', `/cardapio/${rest.slug}`);
    } catch (e) {
      // ignore in iframe
    }
  };

  // Load menu items for current restaurant whenever active restaurant changes
  useEffect(() => {
    if (!activeRestaurant) return;
    const loadTenantMenu = async () => {
      try {
        const items = await getMenuItemsForRestaurant(activeRestaurant.id);
        if (items && items.length > 0) {
          setMenuItems(items);
          if (activeRestaurant.categories && activeRestaurant.categories.length > 0) {
            setActiveCategory(activeRestaurant.categories[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar cardápio do restaurante:', err);
      }
    };
    loadTenantMenu();
  }, [activeRestaurant?.id]);

  // Listen for real-time updates dispatched by dashboard
  useEffect(() => {
    const handleMenuUpdated = async () => {
      if (!activeRestaurant) return;
      try {
        const items = await getMenuItemsForRestaurant(activeRestaurant.id);
        if (items && items.length > 0) {
          setMenuItems(items);
        }
      } catch (err) {
        console.error('Erro ao atualizar cardápio:', err);
      }
    };

    const handleRestaurantUpdated = (e: any) => {
      const updated = e.detail?.restaurant;
      if (updated && activeRestaurant && updated.id === activeRestaurant.id) {
        setActiveRestaurant(updated);
      }
    };

    window.addEventListener('menu-updated', handleMenuUpdated);
    window.addEventListener('restaurant-updated', handleRestaurantUpdated);
    return () => {
      window.removeEventListener('menu-updated', handleMenuUpdated);
      window.removeEventListener('restaurant-updated', handleRestaurantUpdated);
    };
  }, [activeRestaurant?.id]);

  const [selectedProduct, setSelectedProduct] = useState<MenuItem>(
    MENU_ITEMS.find((m) => m.id === 'o-chefao') || MENU_ITEMS[0]
  );

  // Synchronize selectedProduct with loaded database menu
  useEffect(() => {
    if (menuItems.length > 0) {
      setSelectedProduct((prev) => {
        const found = menuItems.find((m) => m.id === prev?.id);
        return found || menuItems[0];
      });
    }
  }, [menuItems]);

  const [activeCategory, setActiveCategory] = useState<string>('Hambúrgueres');
  const [favorites, setFavorites] = useState<string[]>(['o-chefao', 'o-magnata', 'o-padrinho']);
  const [couponCode, setCouponCode] = useState<string>('');

  // Default Cart state starts empty
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);

  // Customer registration states
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [address, setAddress] = useState<UserAddress>({
    street: '',
    details: '',
    neighborhood: '',
    cityState: 'São Paulo - SP',
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Toggle favorite helper
  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // Navigating back stack helper
  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  // Select item in catalog to trigger product detail screen
  const handleSelectProduct = (product: MenuItem) => {
    setSelectedProduct(product);
    setCurrentScreen('detail');
  };

  // Add customized item from detail page with selected sides & notes
  const handleAddToCart = (
    product: MenuItem,
    quantity: number,
    selectedSides: MenuItem[],
    notes?: string
  ) => {
    const cleanNotes = notes?.trim() || '';
    const existing = cartItems.find((item) => {
      const sameProduct = item.menuItem.id === product.id;
      const sameSidesCount = (item.selectedSides?.length || 0) === selectedSides.length;
      const sameSidesIds = selectedSides.every((side) =>
        item.selectedSides?.some((s) => s.id === side.id)
      );
      const sameNotes = (item.notes || '') === cleanNotes;
      return sameProduct && sameSidesCount && sameSidesIds && sameNotes;
    });

    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      const newCartItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menuItem: product,
        quantity,
        selectedSides,
        notes: cleanNotes,
      };
      setCartItems([...cartItems, newCartItem]);
    }
  };

  // Add Item to cart directly using (+) button on grid cards
  const handleAddToCartDirect = (product: MenuItem) => {
    const existing = cartItems.find(
      (item) => item.menuItem.id === product.id && (!item.selectedSides || item.selectedSides.length === 0)
    );
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newCartItem: CartItem = {
        id: `cart-direct-${Date.now()}`,
        menuItem: product,
        quantity: 1,
        selectedSides: [],
      };
      setCartItems([...cartItems, newCartItem]);
    }
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === cartId) {
          const nextQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, nextQty) };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== cartId));
  };

  const handleUpdateNotes = (cartId: string, notes: string) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === cartId ? { ...item, notes } : item
      )
    );
  };

  const handleAddOrder = (order: Order) => {
    setOrders([...orders, order]);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCouponCode('');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface select-none relative w-full overflow-x-hidden transition-all duration-300">
      {/* Premium Desktop Header */}
      {['menu', 'orders', 'favorites', 'profile'].includes(currentScreen) && (
        <header className="hidden md:flex sticky top-0 w-full z-50 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5 h-20 items-center justify-between px-8 shadow-md">
          <div className="flex items-center gap-3 cursor-pointer select-none animate-fade-in" onClick={() => setCurrentScreen('menu')}>
            <div className="relative p-0.5 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-full shrink-0 shadow-lg shadow-primary-orange/15">
              <img
                alt="Logo"
                className="h-10 w-10 object-cover rounded-full bg-black border border-white/10"
                src={logo}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black tracking-tighter text-white uppercase leading-none">
                {branding.name}
              </span>
              <span className="text-[9px] font-black text-primary-orange uppercase tracking-widest mt-0.5">
                {branding.tag}
              </span>
            </div>
          </div>

          {/* Links Navigation */}
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentScreen('menu')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 outline-none ${
                currentScreen === 'menu' || currentScreen === 'detail'
                  ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/25'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setCurrentScreen('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 outline-none ${
                currentScreen === 'orders'
                  ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/25'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setCurrentScreen('favorites')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 outline-none ${
                currentScreen === 'favorites'
                  ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/25'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              Favoritos
            </button>
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 outline-none ${
                currentScreen === 'profile' || currentScreen === 'dashboard'
                  ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/25'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              Perfil
            </button>
          </nav>

          {/* Right side Actions */}
          <div className="flex items-center gap-4">
            {/* Cart Widget */}
            <button
              onClick={() => setCurrentScreen('cart')}
              className={`relative p-3 border rounded-2xl transition-all duration-150 active:scale-95 group flex items-center justify-center hover:shadow-lg hover:shadow-primary-orange/10 ${
                currentScreen === 'cart'
                  ? 'bg-primary-orange/15 border-primary-orange text-primary-orange'
                  : 'bg-white/5 border-white/10 text-primary-orange hover:bg-white/10'
              }`}
              title="Ver Carrinho"
            >
              <span className="group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-orange text-white text-[10px] h-5 min-w-5 flex items-center justify-center font-black rounded-full px-1 shadow-md border border-black animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {currentScreen === 'menu' && (
        <MenuScreen
          menuItems={menuItems}
          cartItems={cartItems}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onSelectProduct={handleSelectProduct}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onChangeScreen={setCurrentScreen}
          onAddToCartDirect={handleAddToCartDirect}
          activeRestaurant={activeRestaurant}
          allRestaurants={restaurants}
          onSelectRestaurant={handleSelectRestaurant}
        />
      )}

      {currentScreen === 'detail' && (
        <DetailScreen
          product={selectedProduct}
          onBack={handleBackToMenu}
          onAddToCart={handleAddToCart}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          activeRestaurant={activeRestaurant}
        />
      )}

      {currentScreen === 'cart' && (
        <CartScreen
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onUpdateNotes={handleUpdateNotes}
          onBack={handleBackToMenu}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onBack={() => setCurrentScreen('cart')}
          onChangeScreen={setCurrentScreen}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          address={address}
          setAddress={setAddress}
          deliveryFee={deliveryFee}
          setDeliveryFee={setDeliveryFee}
          activeRestaurant={activeRestaurant}
        />
      )}

      {currentScreen === 'checkout' && (
        <CheckoutScreen
          cartItems={cartItems}
          couponCode={couponCode}
          customerName={customerName}
          customerPhone={customerPhone}
          setCustomerName={setCustomerName}
          setCustomerPhone={setCustomerPhone}
          address={address}
          setAddress={setAddress}
          address={address}
          setAddress={setAddress}
          deliveryFee={deliveryFee}
          onClearCart={handleClearCart}
          onBack={() => setCurrentScreen('register')}
          onAddOrder={handleAddOrder}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
        />
      )}

      {currentScreen === 'orders' && (
        <OrdersList
          orders={orders}
          onBack={handleBackToMenu}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
          customerName={customerName}
          customerPhone={customerPhone}
        />
      )}

      {currentScreen === 'favorites' && (
        <FavoriteScreen
          menuItems={menuItems}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onSelectProduct={handleSelectProduct}
          onBack={handleBackToMenu}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          onBack={handleBackToMenu}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
          onOpenSuperAdmin={() => setCurrentScreen('superadmin')}
          customerName={customerName}
          customerPhone={customerPhone}
        />
      )}

      {currentScreen === 'dashboard' && (
        <DashboardScreen
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          onBack={() => setCurrentScreen('profile')}
          onChangeScreen={setCurrentScreen}
          activeRestaurant={activeRestaurant}
          allRestaurants={restaurants}
          onSelectRestaurant={handleSelectRestaurant}
          onOpenSuperAdmin={() => setCurrentScreen('superadmin')}
        />
      )}

      {currentScreen === 'superadmin' && (
        <SuperAdminScreen
          onBack={() => setCurrentScreen('profile')}
          onSelectRestaurant={(rest) => {
            handleSelectRestaurant(rest);
            setCurrentScreen('dashboard');
          }}
        />
      )}

      <Footer />

      {['menu', 'orders', 'favorites', 'profile'].includes(currentScreen) && (
        <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-20 px-4 pb-safe left-1/2 -translate-x-1/2 rounded-t-3xl shadow-xl">
          <button
            onClick={() => setCurrentScreen('menu')}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-200 outline-none ${
              currentScreen === 'menu'
                ? 'bg-primary-orange/15 text-primary-orange font-bold'
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <span className="text-lg">
              <Flame className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Menu</span>
          </button>

          <button
            onClick={() => setCurrentScreen('orders')}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-200 outline-none ${
              currentScreen === 'orders'
                ? 'bg-primary-orange/15 text-primary-orange font-bold'
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <span>
              <ReceiptText className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Pedidos</span>
          </button>

          <button
            onClick={() => setCurrentScreen('favorites')}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-200 outline-none ${
              currentScreen === 'favorites'
                ? 'bg-primary-orange/15 text-primary-orange font-bold'
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <span>
              <Heart className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Favoritos</span>
          </button>

          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-200 outline-none ${
              currentScreen === 'profile'
                ? 'bg-primary-orange/15 text-primary-orange font-bold'
                : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <span>
              <User className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
}
