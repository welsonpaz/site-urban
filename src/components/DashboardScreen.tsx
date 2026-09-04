import ProductImageUpload from './admin/ProductImageUpload';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, Plus, Edit, Trash2, Search, Users, Check, RotateCcw, Sparkles, MapPin, Layers, Utensils, Smartphone, FileText, X, AlertTriangle, Lock, ShieldAlert, Upload, Tag, Percent, Clock, ShoppingBag, Truck, ExternalLink, Shield, LogOut, Mail } from 'lucide-react';
import { MenuItem, ScreenType, Coupon, Restaurant } from '../types';
import { MOCK_LOGO_INVERSE_URL, MENU_ITEMS, MOCK_LOGO_URL } from '../data';
import { getCustomers, getMenuItemsFromDB, saveMenuItemInDB, deleteMenuItemInDB, CustomerProfile } from '../lib/firebase';
import { useLogo, saveLogoToDB, deleteLogoFromDB, useBranding, saveBrandingToDB, isStoreOpen } from '../lib/logoState';
import { compressImage } from '../lib/imageCompression';
import { useCoupons, saveCouponToDB, deleteCouponFromDB, restoreDefaultCouponsInDB } from '../lib/couponState';
import { loginWithGoogle, loginWithEmail, logoutUser, subscribeToAuthState, AuthProfile } from '../lib/authService';
import OrdersManagerTab from './admin/OrdersManagerTab';
import CategoriesManagerTab from './admin/CategoriesManagerTab';
import AdditionalsManagerTab from './admin/AdditionalsManagerTab';
import DeliverySettingsTab from './admin/DeliverySettingsTab';

interface DashboardScreenProps {
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  activeRestaurant?: Restaurant | null;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  onOpenSuperAdmin?: () => void;
  allRestaurants?: Restaurant[];
}

export default function DashboardScreen({ 
  onBack, 
  onChangeScreen, 
  menuItems, 
  setMenuItems,
  activeRestaurant,
  onSelectRestaurant,
  onOpenSuperAdmin,
  allRestaurants
}: DashboardScreenProps) {
  const logo = activeRestaurant?.logoUrl || useLogo();
  const branding = useBranding();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // Branding states
  const [brandName, setBrandName] = useState(branding.name);
  const [brandTag, setBrandTag] = useState(branding.tag);
  const [brandSubtitle, setBrandSubtitle] = useState(branding.subtitle);
  const [openingTime, setOpeningTime] = useState(branding.openingTime || '18:00');
  const [closingTime, setClosingTime] = useState(branding.closingTime || '23:30');
  const [daysText, setDaysText] = useState(branding.daysText || 'Terça a Domingo');
  const [statusMode, setStatusMode] = useState<'auto' | 'open' | 'closed'>(branding.statusMode || 'auto');
  const [openDays, setOpenDays] = useState<number[]>(branding.openDays || [0, 2, 3, 4, 5, 6]);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    if (branding) {
      setBrandName(branding.name);
      setBrandTag(branding.tag);
      setBrandSubtitle(branding.subtitle);
      setOpeningTime(branding.openingTime || '18:00');
      setClosingTime(branding.closingTime || '23:30');
      setDaysText(branding.daysText || 'Terça a Domingo');
      setStatusMode(branding.statusMode || 'auto');
      setOpenDays(branding.openDays || [0, 2, 3, 4, 5, 6]);
    }
  }, [branding]);

  const handleToggleDay = (dayIndex: number) => {
    setOpenDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSaveBrandingTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      alert('O nome do estabelecimento não pode estar em branco.');
      return;
    }
    setSavingBranding(true);
    try {
      await saveBrandingToDB({
        name: brandName.trim(),
        tag: brandTag.trim(),
        subtitle: brandSubtitle.trim(),
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        daysText: daysText.trim(),
        statusMode: statusMode,
        openDays: openDays,
      });
      alert('Informações de marca e horário de funcionamento atualizados com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações de marca.');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const base64 = await compressImage(file, 300, 300, 0.85);
      await saveLogoToDB(base64);
      alert('Logo atualizada com sucesso em todos os ambientes!');
    } catch (err) {
      console.error(err);
      alert('Falha ao subir imagem da logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    if (!confirm('Deseja realmente restaurar a logo padrão original?')) return;
    setUploadingLogo(true);
    try {
      await deleteLogoFromDB();
      alert('Logo restaurada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Falha ao restaurar a logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProductImage(true);
    try {
      const base64 = await compressImage(file, 600, 600, 0.75);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    } catch (err) {
      console.error(err);
      alert('Falha ao processar imagem do produto.');
    } finally {
      setUploadingProductImage(false);
    }
  };

  // Firebase Authentication & Role-Based Access Control
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setAuthProfile(profile);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      setLoginError('Falha ao autenticar com conta Google. Verifique pop-ups.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha seu e-mail e senha.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginWithEmail(loginEmail, loginPassword);
    } catch (err: unknown) {
      console.error(err);
      setLoginError('Credenciais inválidas no Firebase Auth.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthProfile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const isSuperAdmin = authProfile?.role === 'super_admin';
  const isRestaurantAdmin = authProfile?.role === 'restaurant_admin' && 
    (authProfile.restaurantId === activeRestaurant?.id || authProfile.restaurantId === activeRestaurant?.slug);
  const isAuthorized = isSuperAdmin || isRestaurantAdmin;

  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'categories' | 'additionals' | 'delivery' | 'customers' | 'coupons'>('menu');
  const { coupons, reloadCoupons } = useCoupons();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [couponFormData, setCouponFormData] = useState<Partial<Coupon>>({
    id: '',
    code: '',
    discount: 0,
    type: 'percent',
    description: '',
    minOrderValue: 0
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');
  
  // Database customers state
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Menu items list state
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Edit / Add Item state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    id: '',
    name: '',
    description: '',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Tradicionais',
    rating: 5.0,
    ratingCount: '1',
    isPopular: false,
    ingredients: []
  });

  const [ingredientName, setIngredientName] = useState('');
  const [ingredientIcon, setIngredientIcon] = useState('Cookie');

  // Load registered customers and database menu
  useEffect(() => {
    if (isAuthorized && activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab, isAuthorized]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await getCustomers(authProfile?.role === 'super_admin' ? undefined : activeRestaurant?.id);
      // Sort by updatedAt descending
      data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao buscar clientes do banco de dados:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
      category: 'Hambúrgueres',
      burgerType: 'Tradicionais',
      rating: 4.8,
      ratingCount: '15',
      isPopular: false,
      ingredients: []
    });
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setFormData({ ...item });
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleAddIngredient = () => {
    if (!ingredientName.trim()) return;
    const currentIngredients = formData.ingredients || [];
    setFormData({
      ...formData,
      ingredients: [...currentIngredients, { name: ingredientName.trim(), icon: ingredientIcon }]
    });
    setIngredientName('');
  };

  const handleRemoveIngredient = (index: number) => {
    const currentIngredients = formData.ingredients || [];
    setFormData({
      ...formData,
      ingredients: currentIngredients.filter((_, idx) => idx !== index)
    });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.price || formData.price <= 0) {
      alert('Por favor, preencha o nome e um preço válido maior que zero.');
      return;
    }

    const newItem: MenuItem = {
      id: formData.id || `item-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description || '',
      price: Number(formData.price),
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
      category: formData.category as MenuItem['category'],
      burgerType: formData.category === 'Hambúrgueres' ? (formData.burgerType as MenuItem['burgerType']) : undefined,
      rating: formData.rating || 5.0,
      ratingCount: String(formData.ratingCount || '1'),
      isPopular: !!formData.isPopular,
      ingredients: formData.ingredients || []
    };

    setLoadingMenu(true);
    try {
      // Save in Firestore
      await saveMenuItemInDB(newItem);
      
      // Update local state list in parent App.tsx
      setMenuItems((prev) => {
        const index = prev.findIndex((i) => i.id === newItem.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = newItem;
          return updated;
        } else {
          return [newItem, ...prev];
        }
      });

      alert('Item de cardápio salvo com sucesso no banco de dados!');
      setIsAdding(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar item no Firestore.');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Deseja realmente remover este item do cardápio permanentemente?')) return;

    setLoadingMenu(true);
    try {
      await deleteMenuItemInDB(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      alert('Item removido com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover item no Firestore.');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Reverts Firestore catalog back to original static mock data
  const handleResetToDefaults = async () => {
    if (!confirm('ATENÇÃO: Isso irá substituir o cardápio atual na nuvem pelos itens padrão originais. Confirmar?')) return;

    setLoadingMenu(true);
    try {
      // Delete existing menu items first
      for (const item of menuItems) {
        await deleteMenuItemInDB(item.id);
      }
      
      // Upload default menu items
      for (const defaultItem of MENU_ITEMS) {
        await saveMenuItemInDB(defaultItem);
      }

      setMenuItems(MENU_ITEMS);
      alert('Cardápio restaurado com sucesso na nuvem!');
    } catch (err) {
      console.error(err);
      alert('Erro ao redefinir cardápio.');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Filter lists based on searches
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategoryFilter === 'Todos' || item.category === selectedCategoryFilter;
    const q = menuSearch.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const filteredCustomers = customers.filter((customer) => {
    const q = customerSearch.trim().toLowerCase();
    return !q || customer.name.toLowerCase().includes(q) || customer.phone.includes(q) || customer.neighborhood.toLowerCase().includes(q);
  });

  const filteredCoupons = coupons.filter((coupon) => {
    const q = couponSearch.trim().toLowerCase();
    return !q || coupon.code.toLowerCase().includes(q) || (coupon.description && coupon.description.toLowerCase().includes(q));
  });

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormData.code?.trim() || couponFormData.discount === undefined || couponFormData.discount <= 0) {
      alert('Por favor, preencha o código do cupom e um desconto válido maior que zero.');
      return;
    }

    const cleanCode = couponFormData.code.trim().toUpperCase();
    const isEditingMode = !!editingCoupon;
    const couponId = isEditingMode ? editingCoupon!.id : cleanCode;

    const newCoupon: Coupon = {
      id: couponId,
      code: cleanCode,
      discount: Number(couponFormData.discount),
      type: (couponFormData.type || 'percent') as 'percent' | 'fixed',
      description: couponFormData.description?.trim() || '',
      minOrderValue: couponFormData.minOrderValue ? Number(couponFormData.minOrderValue) : 0
    };

    setSavingCoupon(true);
    try {
      await saveCouponToDB(newCoupon);
      alert('Cupom salvo com sucesso na nuvem!');
      setIsAddingCoupon(false);
      setEditingCoupon(null);
      reloadCoupons();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cupom no Firestore.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${coupon.code}" permanentemente?`)) return;

    try {
      await deleteCouponFromDB(coupon.id);
      alert('Cupom excluído com sucesso!');
      reloadCoupons();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir cupom.');
    }
  };

  const handleRestoreDefaultCoupons = async () => {
    if (!confirm('Deseja restaurar os cupons de desconto padrão de demonstração?')) return;

    try {
      await restoreDefaultCouponsInDB();
      alert('Cupons padrão restaurados com sucesso!');
      reloadCoupons();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar cupons padrão.');
    }
  };

  const handleEditCouponClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsAddingCoupon(true);
    setCouponFormData({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
      description: coupon.description || '',
      minOrderValue: coupon.minOrderValue || 0
    });
  };

  const handleAddCouponClick = () => {
    setEditingCoupon(null);
    setIsAddingCoupon(true);
    setCouponFormData({
      id: '',
      code: '',
      discount: 0,
      type: 'percent',
      description: '',
      minOrderValue: 0
    });
  };

  if (checkingAuth) {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-primary-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-white">Auditando credenciais no Firebase...</p>
        <p className="text-xs text-on-surface-variant mt-1">Verificando autorização do estabelecimento</p>
      </div>
    );
  }

  // Not logged in: Show Firebase Auth login gate
  if (!authProfile) {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface font-sans flex flex-col items-center justify-center p-5 relative">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-on-surface-variant hover:text-white flex items-center gap-2 text-xs font-black bg-white/5 border border-white/5 px-4 py-2 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-primary-orange" /> Voltar ao Cardápio
        </button>

        {/* Auth Box */}
        <div className="w-full max-w-sm bg-surface-container-low p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary-orange to-primary-accent rounded-full" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto border border-white/10 bg-black/40 p-1 flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeRestaurant?.name || 'Painel Administrativo'}
            </h2>
            <p className="text-[10px] text-on-surface-variant/80 font-semibold leading-relaxed">
              Área administrativa restrita protegida por Firebase Authentication (RBAC). Identifique-se para continuar.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{loginLoading ? 'Conectando...' : 'Entrar com Conta Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-surface-container-low px-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              ou e-mail e senha
            </span>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="gerente@restaurante.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loginLoading ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </form>

          {onOpenSuperAdmin && (
            <div className="pt-2 text-center border-t border-white/5">
              <button
                type="button"
                onClick={onOpenSuperAdmin}
                className="text-[11px] text-primary-accent hover:text-white font-bold inline-flex items-center gap-1 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-primary-orange" />
                Sou Super Admin WP Integrada
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Logged in but not authorized for this specific restaurant
  if (!isAuthorized) {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface font-sans flex flex-col items-center justify-center p-5 relative">
        <div className="w-full max-w-sm bg-surface-container-low p-6 rounded-3xl border border-red-500/30 shadow-2xl space-y-5 text-center">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Acesso Negado</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A conta <strong className="text-white">{authProfile.email}</strong> está conectada, porém não possui privilégios de administração para o restaurante <strong className="text-primary-orange">{activeRestaurant?.name || 'selecionado'}</strong>.
            </p>
            <p className="text-[10px] text-on-surface-variant/60">
              O isolamento multi-tenant restringe o acesso aos dados apenas a gerentes cadastrados ou Super Admins.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold text-xs rounded-xl transition-all"
            >
              Desconectar e Trocar de Conta
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 bg-surface-container-high hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
            >
              Voltar ao Cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-32">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-dark-bg/95 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-5 justify-between max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-sm">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-primary-orange p-1 hover:bg-white/5 rounded-full outline-none mr-3 transition-transform active:scale-95 shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-none">
              <Database className="w-4 h-4 text-primary-orange" />
              {activeRestaurant ? activeRestaurant.name : 'Painel Administrativo'}
            </h1>
            <span className="text-[10px] text-primary-orange font-semibold mt-0.5 leading-none font-mono">
              {activeRestaurant ? `/cardapio/${activeRestaurant.slug}` : 'Gerencie o cardápio e visualize clientes'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSuperAdmin && (
            <button
              onClick={onOpenSuperAdmin}
              className="px-2.5 py-1.5 bg-surface-container-high hover:bg-white/10 border border-white/10 rounded-xl text-primary-accent hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Painel Central WP Integrada"
            >
              <Shield className="w-3.5 h-3.5 text-primary-orange" />
              <span className="hidden sm:inline">Super Admin WP</span>
            </button>
          )}

          <button
            onClick={() => onChangeScreen('menu')}
            className="px-2.5 py-1.5 bg-primary-orange/15 hover:bg-primary-orange/25 border border-primary-orange/30 rounded-xl text-primary-orange text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
            title="Ver cardápio do cliente"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Cardápio</span>
          </button>

          <div className="relative shrink-0 cursor-pointer select-none" onClick={() => onChangeScreen('menu')}>
            <img
              alt="Logo"
              className="h-9 w-9 object-cover rounded-full border border-white/10 aspect-square bg-black"
              src={logo}
            />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors shrink-0"
            title={`Sair da conta (${authProfile?.email})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        <div className="flex overflow-x-auto p-1 bg-surface-container-low rounded-xl border border-white/5 scrollbar-none gap-1">
          <button
            onClick={() => { setActiveTab('menu'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Cardápio
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Pedidos (Ao Vivo)
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Categorias
          </button>
          <button
            onClick={() => { setActiveTab('additionals'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'additionals'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionais
          </button>
          <button
            onClick={() => { setActiveTab('delivery'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'delivery'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Taxas & Horários
          </button>
          <button
            onClick={() => { setActiveTab('coupons'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'coupons'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Cupons
          </button>
          <button
            onClick={() => { setActiveTab('customers'); setIsAdding(false); setEditingItem(null); setEditingCoupon(null); setIsAddingCoupon(false); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'customers'
                ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/10'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clientes
          </button>
        </div>
      </div>

      {/* Main container */}
      <main className="px-5 pt-4 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        
        {/* TAB 1: EDIT CARDÁPIO */}
        {activeTab === 'menu' && !isAdding && !editingItem && (
          <div className="space-y-4">
            {/* CARD: CONFIGURAÇÃO DE MARCA E CABEÇALHO */}
            <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-orange to-primary-accent" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-orange/10 border border-primary-orange/20 rounded-xl flex items-center justify-center text-primary-orange shadow-inner">
                    <Sparkles className="w-5 h-5 text-primary-orange" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Configuração do Cabeçalho & Marca</h3>
                    <p className="text-[10px] text-on-surface-variant/60 font-semibold mt-0.5">
                      Personalize o nome, slogan, descrição e logomarca exibidos aos clientes
                    </p>
                  </div>
                </div>

                {/* Live Preview circle */}
                <div className="relative shrink-0 p-1 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-xl shadow-lg">
                  <img
                    alt="Logo Estabelecimento"
                    className="h-14 w-14 object-cover rounded-lg bg-black border border-white/5 aspect-square"
                    src={logo}
                  />
                </div>
              </div>

              {/* Logo section */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">Logomarca</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-lowest hover:bg-white/5 border border-white/5 hover:border-primary-orange/30 text-white font-extrabold text-[11px] rounded-xl cursor-pointer active:scale-95 transition-all">
                    <Upload className="w-4 h-4 text-primary-orange" />
                    <span>{uploadingLogo ? 'Enviando...' : 'Alterar Logomarca (PNG/JPG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>

                  {logo !== MOCK_LOGO_URL && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      disabled={uploadingLogo}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 text-red-400 text-[11px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Logo Padrão
                    </button>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/5 my-4" />

              {/* Text Fields Section */}
              <form onSubmit={handleSaveBrandingTexts} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome do Estabelecimento */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                      Nome do Estabelecimento
                    </label>
                    <input
                      className="w-full px-4 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all font-bold"
                      placeholder="Ex: Urban Burguer"
                      required
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>

                  {/* Slogan / Tagline */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                      Slogan / Tag (Ex: SABOR • ATITUDE • QUALIDADE)
                    </label>
                    <input
                      className="w-full px-4 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all uppercase font-mono text-[10px]"
                      placeholder="Ex: SABOR • ATITUDE • QUALIDADE"
                      required
                      type="text"
                      value={brandTag}
                      onChange={(e) => setBrandTag(e.target.value)}
                    />
                  </div>
                </div>

                {/* Descrição do Cabeçalho */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                    Descrição do Estabelecimento (Subtítulo)
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all min-h-[60px] leading-relaxed"
                    placeholder="Ex: Hamburgueria artesanal premium com burgers grelhados na brasa..."
                    required
                    value={brandSubtitle}
                    onChange={(e) => setBrandSubtitle(e.target.value)}
                  />
                </div>

                {/* Seção Horário de Funcionamento e Status da Loja */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary-orange" />
                      Horário de Funcionamento & Status
                    </h4>
                    {/* Live store status badge in admin */}
                    {isStoreOpen({ name: brandName, subtitle: brandSubtitle, tag: brandTag, logoUrl: logo, openingTime, closingTime, daysText, statusMode, openDays }).isOpen ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ABERTO AGORA
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        FECHADO AGORA
                      </span>
                    )}
                  </div>

                  {/* Status mode selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                      Modo do Status da Loja
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusMode('auto')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                          statusMode === 'auto'
                            ? 'bg-primary-orange/20 border-primary-orange text-white shadow-md'
                            : 'bg-surface-container-lowest border-white/5 text-on-surface-variant hover:text-white'
                        }`}
                      >
                        ⏱️ Automático (Relógio)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusMode('open')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                          statusMode === 'open'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-surface-container-lowest border-white/5 text-on-surface-variant hover:text-white'
                        }`}
                      >
                        🟢 Forçar Aberto
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusMode('closed')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                          statusMode === 'closed'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                            : 'bg-surface-container-lowest border-white/5 text-on-surface-variant hover:text-white'
                        }`}
                      >
                        🔴 Forçar Fechado
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Horário de Abertura */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Abre às
                      </label>
                      <input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white outline-none focus:border-primary-orange/40 transition-all font-mono font-bold"
                      />
                    </div>

                    {/* Horário de Fechamento */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Fecha às
                      </label>
                      <input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white outline-none focus:border-primary-orange/40 transition-all font-mono font-bold"
                      />
                    </div>

                    {/* Texto dos Dias de Funcionamento */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Rótulo dos Dias (Ex: Ter a Dom)
                      </label>
                      <input
                        type="text"
                        value={daysText}
                        onChange={(e) => setDaysText(e.target.value)}
                        placeholder="Ex: Terça a Domingo"
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest rounded-xl border border-white/5 text-xs text-white outline-none focus:border-primary-orange/40 transition-all font-bold"
                      />
                    </div>
                  </div>

                  {/* Dias da semana clicáveis (0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                      Dias em que a loja ABRE (Toque para ativar/desativar)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { day: 0, label: 'Dom' },
                        { day: 1, label: 'Seg' },
                        { day: 2, label: 'Ter' },
                        { day: 3, label: 'Qua' },
                        { day: 4, label: 'Qui' },
                        { day: 5, label: 'Sex' },
                        { day: 6, label: 'Sáb' },
                      ].map(({ day, label }) => {
                        const isSelected = openDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleDay(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              isSelected
                                ? 'bg-primary-orange text-white shadow-md shadow-primary-orange/20 scale-105'
                                : 'bg-surface-container-lowest text-on-surface-variant/40 border border-white/5 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save branding button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingBranding}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-primary-orange/10 disabled:opacity-50"
                  >
                    {savingBranding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar Cabeçalho & Marca
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="Buscar prato no cardápio..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleOpenAdd}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </button>
                <button
                  onClick={handleResetToDefaults}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-on-surface-variant text-xs font-bold rounded-xl active:scale-95 transition-transform"
                  title="Restaurar Cardápio Padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-primary-orange" />
                  Resetar Padrão
                </button>
              </div>
            </div>

            {/* Category filters inside Admin panel */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['Todos', 'Hambúrgueres', 'Combos', 'Porções', 'Bebidas'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                    selectedCategoryFilter === category
                      ? 'bg-gradient-to-r from-primary-orange to-primary-accent text-white shadow-md shadow-primary-orange/15 border border-primary-orange/30'
                      : 'bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu catalog list */}
            <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-surface-container-low/50 flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-orange" />
                  Pratos Cadastrados ({filteredMenuItems.length})
                </h3>
              </div>

              <div className="divide-y divide-white/5 max-h-[550px] overflow-y-auto">
                {filteredMenuItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    Nenhum prato encontrado com o termo informado.
                  </div>
                ) : (
                  filteredMenuItems.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4 items-center hover:bg-white/[0.01] transition-colors">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/5"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-white truncate">{item.name}</h4>
                          <span className="text-[9px] font-bold bg-primary-orange/10 text-primary-orange border border-primary-orange/15 px-1.5 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          {item.isPopular && (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant/80 truncate mt-0.5">{item.description}</p>
                        <p className="text-xs font-black text-primary-orange mt-1">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-primary-accent rounded-lg transition-all active:scale-90"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 text-red-400 rounded-lg transition-all active:scale-90"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD OR EDIT MENU ITEM FORM */}
        {(isAdding || editingItem) && (
          <form onSubmit={handleSaveItem} className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary-orange" />
                {isAdding ? 'Adicionar Novo Prato' : `Editar: ${editingItem?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                className="text-on-surface-variant hover:text-white p-1 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ID field (disabled if editing) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Código Único (ID)</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingItem}
                  placeholder="Ex: urban-duplo"
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none disabled:opacity-50 transition-all"
                  required
                />
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Nome do Prato</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Monster Burger"
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                  required
                />
              </div>

              {/* Price field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="32.50"
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                  required
                />
              </div>

              {/* Category field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItem['category'] })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                >
                  <option value="Hambúrgueres">Hambúrgueres</option>
                  <option value="Combos">Combos</option>
                  <option value="Porções">Porções</option>
                  <option value="Bebidas">Bebidas</option>
                </select>
              </div>

              {/* Burger sub-type if Category is Hamburguer */}
              {formData.category === 'Hambúrgueres' && (
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Tipo de Hambúrguer</label>
                  <div className="flex gap-4">
                    {['Tradicionais', 'Simples', 'Especiais'].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="burgerType"
                          value={type}
                          checked={formData.burgerType === type}
                          onChange={(e) => setFormData({ ...formData, burgerType: e.target.value as MenuItem['burgerType'] })}
                          className="accent-primary-orange"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Image URL & Upload field */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Imagem do Produto</label>
                  <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase">Insira URL ou Faça Upload</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* URL Text Input */}
                  <div className="md:col-span-7">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Cole a URL da imagem (https://...)"
                      className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                    />
                  </div>

                  {/* Or separator */}
                  <div className="text-center text-[10px] text-on-surface-variant/40 font-bold md:col-span-1">OU</div>

                  {/* File Upload Button */}
                  <div className="md:col-span-4">
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-extrabold text-xs rounded-xl cursor-pointer active:scale-95 transition-all text-center">
                      <Upload className="w-4 h-4 text-primary-orange" />
                      <span>{uploadingProductImage ? 'Processando...' : 'Fazer Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProductImageUpload}
                        disabled={uploadingProductImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Micro Image preview in Form */}
                {formData.imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-surface-container-lowest rounded-xl border border-white/5 mt-1">
                    <img
                      src={formData.imageUrl}
                      alt="Miniatura do Produto"
                      className="w-10 h-10 rounded-lg object-cover border border-white/5"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase block">Visualização Prévia</span>
                      <span className="text-[10px] text-white/75 truncate block font-mono">
                        {formData.imageUrl.startsWith('data:') ? 'Imagem carregada localmente (Base64)' : formData.imageUrl}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description field */}
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Descrição / Ingredientes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Ex: Pão brioche, carne de 150g, queijo cheddar..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all resize-none"
                />
              </div>

              {/* Rating metrics */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Nota Média (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Contagem de Avaliações</label>
                <input
                  type="text"
                  value={formData.ratingCount || ''}
                  onChange={(e) => setFormData({ ...formData, ratingCount: e.target.value })}
                  placeholder="Ex: 142"
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                />
              </div>

              {/* Checkbox Popular */}
              <div className="col-span-1 sm:col-span-2 flex items-center gap-2.5 py-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-orange bg-surface-container-lowest border-white/5 accent-primary-orange cursor-pointer"
                />
                <label htmlFor="isPopular" className="text-xs font-bold text-white cursor-pointer select-none">
                  Marcar este item como "Popular" (Mais Pedidos no topo)
                </label>
              </div>

              {/* Custom Ingredients Chips (List) */}
              <div className="col-span-1 sm:col-span-2 space-y-3 pt-2 border-t border-white/5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant block">Ingredientes em Destaque (Ícones)</label>
                
                {/* Add block */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome. Ex: Pão Brioche"
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                    className="flex-grow px-3 py-2 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 outline-none focus:border-primary-orange/40"
                  />
                  <select
                    value={ingredientIcon}
                    onChange={(e) => setIngredientIcon(e.target.value)}
                    className="px-3 py-2 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 outline-none"
                  >
                    <option value="Cookie">Pão (Cookie)</option>
                    <option value="Beef">Carne (Beef)</option>
                    <option value="Egg">Ovos (Egg)</option>
                    <option value="Layers">Queijo / Frios (Layers)</option>
                    <option value="Leaf">Salada (Leaf)</option>
                    <option value="Flame">Molho (Flame)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-4 py-2 bg-primary-orange hover:bg-primary-orange/95 text-white text-xs font-bold rounded-xl active:scale-95"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Chips container */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(formData.ingredients || []).length === 0 ? (
                    <span className="text-[10px] text-on-surface-variant/50 font-medium italic">Nenhum ingrediente em destaque adicionado ainda.</span>
                  ) : (
                    (formData.ingredients || []).map((ing, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-white/5 text-white border border-white/10 px-2.5 py-1 rounded-full">
                        <span className="text-[9px] text-primary-orange">[{ing.icon}]</span>
                        {ing.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-red-400 hover:text-red-300 ml-1 font-bold text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/15 flex items-center gap-2 active:scale-95 transition-all"
              >
                {loadingMenu ? 'Salvando...' : 'Salvar no Banco de Dados'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: BANCO DE CLIENTES (VIEW DATABASE) */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, tel ou bairro..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 outline-none transition-all"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchCustomers}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-on-surface text-xs font-bold rounded-xl active:scale-95 transition-transform"
              >
                {loadingCustomers ? 'Atualizando...' : 'Atualizar Banco'}
              </button>
            </div>

            {/* Metric Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant/60">Clientes Registrados</span>
                <p className="text-2xl font-black text-white mt-1">{customers.length}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant/60">Bairros Atendidos</span>
                <p className="text-2xl font-black text-primary-orange mt-1">
                  {Array.from(new Set(customers.map(c => c.neighborhood).filter(Boolean))).length}
                </p>
              </div>
            </div>

            {/* Customers table/list */}
            <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-surface-container-low/50 flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary-orange" />
                  Visualizador da Tabela de Clientes
                </h3>
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {loadingCustomers ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    Carregando tabela do banco de dados...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    Nenhum cliente cadastrado no banco de dados ainda.
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <div key={customer.phone} className="p-4 space-y-2 hover:bg-white/[0.01] transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-primary-orange bg-primary-orange/5 border border-primary-orange/10 px-2 py-0.5 rounded-md">
                            #{index + 1}
                          </span>
                          <h4 className="text-xs font-black text-white inline-block ml-2">{customer.name}</h4>
                        </div>
                        <span className="text-[9px] text-on-surface-variant/40 font-semibold font-mono">
                          {new Date(customer.updatedAt).toLocaleDateString('pt-BR')} às {new Date(customer.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-on-surface-variant/90">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-primary-accent" />
                          <span className="font-mono font-bold">{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary-orange" />
                          <span className="truncate">{customer.street}, {customer.neighborhood}</span>
                        </div>
                      </div>

                      {customer.details && (
                        <div className="bg-surface-container-lowest p-2 rounded-lg border border-white/5 text-[10px] text-on-surface-variant">
                          <span className="font-bold text-white block">Referência / Complemento:</span>
                          <span className="italic">"{customer.details}"</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUPONS DE DESCONTO */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {isAddingCoupon ? (
              /* FORMULÁRIO DE CADASTRO/EDIÇÃO */
              <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary-orange" />
                    {editingCoupon ? `Editar Cupom: ${editingCoupon.code}` : 'Cadastrar Novo Cupom'}
                  </h2>
                  <button
                    onClick={() => { setIsAddingCoupon(false); setEditingCoupon(null); }}
                    className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-on-surface-variant hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCoupon} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Código do cupom */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Código do Cupom
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all font-mono uppercase"
                        disabled={!!editingCoupon}
                        placeholder="Ex: SEGREDO10"
                        required
                        type="text"
                        value={couponFormData.code || ''}
                        onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })}
                      />
                      {editingCoupon && (
                        <span className="text-[9px] text-on-surface-variant/40 italic">
                          O código do cupom não pode ser alterado após o cadastro.
                        </span>
                      )}
                    </div>

                    {/* Tipo de Desconto */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Tipo de Desconto
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-white/5 text-xs text-white outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all"
                        value={couponFormData.type || 'percent'}
                        onChange={(e) => setCouponFormData({ ...couponFormData, type: e.target.value as 'percent' | 'fixed' })}
                      >
                        <option value="percent">Porcentagem (%)</option>
                        <option value="fixed">Fixo (R$)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Valor do desconto */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        {couponFormData.type === 'percent' ? 'Porcentagem do Desconto (%)' : 'Valor Fixo de Desconto (R$)'}
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all"
                        min="0.01"
                        placeholder={couponFormData.type === 'percent' ? 'Ex: 15' : 'Ex: 20.00'}
                        required
                        step="any"
                        type="number"
                        value={couponFormData.discount || ''}
                        onChange={(e) => setCouponFormData({ ...couponFormData, discount: parseFloat(e.target.value) })}
                      />
                    </div>

                    {/* Valor Mínimo de Pedido */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                        Valor Mínimo do Pedido (R$ - Opcional)
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all"
                        min="0"
                        placeholder="Deixe em branco ou 0 para nenhum"
                        step="any"
                        type="number"
                        value={couponFormData.minOrderValue || ''}
                        onChange={(e) => setCouponFormData({ ...couponFormData, minOrderValue: e.target.value ? parseFloat(e.target.value) : 0 })}
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
                      Descrição do Cupom (Opcional)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all min-h-[70px]"
                      placeholder="Ex: Desconto especial sem valor mínimo de pedido!"
                      value={couponFormData.description || ''}
                      onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsAddingCoupon(false); setEditingCoupon(null); }}
                      className="px-6 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingCoupon}
                      className="px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-accent text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary-orange/15 disabled:opacity-50"
                    >
                      {savingCoupon ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Cupom'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* DASHBOARD DOS CUPONS */
              <div className="space-y-4">
                {/* Search & Add Action row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-white/5 text-xs text-white placeholder:text-on-surface-variant/40 outline-none focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 transition-all"
                      placeholder="Pesquisar cupom pelo código ou descrição..."
                      type="text"
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultCoupons}
                      className="px-3.5 py-2.5 bg-surface-container border border-white/5 hover:border-white/10 text-on-surface-variant hover:text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      title="Restaurar os cupons de teste padrão da loja"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-primary-orange" />
                      <span className="hidden md:inline">Restaurar Padrão</span>
                    </button>
                    <button
                      onClick={handleAddCouponClick}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-primary-orange/10 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Cupom
                    </button>
                  </div>
                </div>

                {/* Info Card / Metric */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant/60">Cupons Ativos</span>
                    <p className="text-2xl font-black text-white mt-0.5">{coupons.length}</p>
                  </div>
                  <Tag className="w-8 h-8 text-primary-orange/20" />
                </div>

                {/* Coupons List */}
                <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-surface-container-low/50 flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary-orange" />
                      Cupons Cadastrados no Banco de Dados
                    </h3>
                  </div>

                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {filteredCoupons.length === 0 ? (
                      <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
                        <Tag className="w-8 h-8 mx-auto text-on-surface-variant/30" />
                        <p>Nenhum cupom promocional correspondente foi encontrado.</p>
                      </div>
                    ) : (
                      filteredCoupons.map((coupon) => {
                        const isPercent = coupon.type === 'percent';
                        return (
                          <div key={coupon.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.01] transition-all">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-black text-primary-orange bg-primary-orange/10 border border-primary-orange/15 px-3 py-1 rounded-lg uppercase tracking-wider">
                                  {coupon.code}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  {isPercent ? <Percent className="w-3 h-3" /> : 'R$'}
                                  {isPercent ? `${coupon.discount}% OFF` : `R$ ${coupon.discount.toFixed(2).replace('.', ',')} OFF`}
                                </span>
                                {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                                  <span className="text-[9px] font-medium text-on-surface-variant/60 bg-white/5 px-2 py-0.5 rounded-md">
                                    Mín: R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-white/90 font-medium mt-1">
                                {coupon.description || 'Sem descrição cadastrada.'}
                              </p>
                              {coupon.updatedAt && (
                                <span className="text-[9px] text-on-surface-variant/40 block">
                                  Atualizado em {new Date(coupon.updatedAt).toLocaleDateString('pt-BR')} às {new Date(coupon.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={() => handleEditCouponClick(coupon)}
                                className="p-2 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 rounded-xl text-on-surface-variant hover:text-white transition-all active:scale-95"
                                title="Editar cupom"
                              >
                                <Edit className="w-4 h-4 text-primary-orange" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon)}
                                className="p-2 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl text-red-400 hover:text-red-300 transition-all active:scale-95"
                                title="Excluir cupom"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PEDIDOS EM TEMPO REAL */}
        {activeTab === 'orders' && activeRestaurant && (
          <OrdersManagerTab restaurant={activeRestaurant} authProfile={authProfile} />
        )}

        {/* TAB: CATEGORIAS */}
        {activeTab === 'categories' && activeRestaurant && (
          <CategoriesManagerTab 
            restaurant={activeRestaurant} 
            onCategoriesUpdated={(cats) => {
              if (onSelectRestaurant) {
                onSelectRestaurant({ ...activeRestaurant, categories: cats });
              }
            }} 
          />
        )}

        {/* TAB: ADICIONAIS */}
        {activeTab === 'additionals' && activeRestaurant && (
          <AdditionalsManagerTab restaurant={activeRestaurant} />
        )}

        {/* TAB: TAXAS & HORÁRIOS */}
        {activeTab === 'delivery' && activeRestaurant && (
          <DeliverySettingsTab 
            restaurant={activeRestaurant} 
            onRestaurantUpdated={(rest) => {
              if (onSelectRestaurant) {
                onSelectRestaurant(rest);
              }
            }} 
          />
        )}
      </main>
    </div>
  );
}
