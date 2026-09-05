import React, { useState, useEffect } from 'react';
import { db, getProducts, saveMenuItemInDB, deleteMenuItemInDB, getRestaurantData, updateRestaurantData } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Lock, LogOut, Package, Tag, Settings, Image as ImageIcon, Plus, Trash2, Save, AlertCircle, ShieldAlert, ArrowLeft, Upload, MapPin, Clock } from 'lucide-react';
import { subscribeToAuthState, loginWithEmail, logoutUser, AuthProfile } from '../lib/authService';
import { getRestaurantBySlugOrId, saveRestaurantToDB } from '../lib/tenantService';
import { compressImage } from '../lib/imageCompression';
import { saveBrandingToDB } from '../lib/logoState';
import type { Restaurant } from '../types';

interface SuperAdminScreenProps {
  onBack?: () => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export const SuperAdminScreen: React.FC<SuperAdminScreenProps> = ({ onBack, onSelectRestaurant }) => {
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isSuperAdmin = authProfile?.role === 'super_admin';
  
  // Estados do Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Aba ativa do painel ('products' | 'coupons' | 'settings')
  const [activeTab, setActiveTab] = useState<'products' | 'coupons' | 'settings'>('products');

  // Estados de Dados do Painel
  const [logoUrl, setLogoUrl] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [openingTime, setOpeningTime] = useState('18:00');
  const [closingTime, setClosingTime] = useState('23:30');
  const [daysText, setDaysText] = useState('Terça a Domingo');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });

  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '' });

  const [message, setMessage] = useState('');

  // Monitorar estado de autenticação
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setAuthProfile(profile);
      setLoading(false);
      if (profile?.role === 'super_admin') {
        loadAdminData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Carregar dados usando as funções do firebase.ts
  const loadAdminData = async () => {
    try {
      // Carregar configurações do restaurante
      const restaurantData = await getRestaurantData();
      if (restaurantData) {
        setLogoUrl(restaurantData.logoUrl || '');
        setSiteTitle(restaurantData.siteTitle || '');
        setAddress(restaurantData.address || '');
        setNeighborhood(restaurantData.neighborhood || '');
        setCity(restaurantData.city || '');
        setState(restaurantData.state || '');
        setOpeningTime(restaurantData.openingTime || '18:00');
        setClosingTime(restaurantData.closingTime || '23:30');
        setDaysText(restaurantData.daysText || 'Terça a Domingo');
      }

      // Carregar o estabelecimento principal para manter cardápio e painel sincronizados
      const restaurant = await getRestaurantBySlugOrId('urbanburguer');
      if (restaurant) {
        setLogoUrl(restaurant.logoUrl || logoUrl);
        setAddress(restaurant.address || '');
        setNeighborhood(restaurant.neighborhood || '');
        setCity(restaurant.city || '');
        setState(restaurant.state || '');
        setOpeningTime(restaurant.openingTime || '18:00');
        setClosingTime(restaurant.closingTime || '23:30');
        setDaysText(restaurant.daysText || 'Terça a Domingo');
        setSiteTitle(restaurant.name || siteTitle);
      }

      // Carregar Produtos/Menu
      const prods = await getProducts();
      setProducts(prods);

      // Carregar Cupons
      const couponsSnap = await getDocs(collection(db, 'coupons'));
      setCoupons(couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao carregar dados do admin:", error);
    }
  };

  // Função de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setLoginError('Falha ao entrar. Verifique seu e-mail e senha.');
    }
  };

  // Função de Logout
  const handleLogout = async () => {
    await logoutUser();
  };

  // Salvar configurações gerais do estabelecimento
  const handleSaveSettings = async () => {
    try {
      const restaurant = await getRestaurantBySlugOrId('urbanburguer');
      const success = await updateRestaurantData({
        logoUrl, siteTitle, address, neighborhood, city, state,
        openingTime, closingTime, daysText
      });

      if (restaurant) {
        const updatedRestaurant = {
          ...restaurant,
          name: siteTitle || restaurant.name,
          logoUrl: logoUrl || restaurant.logoUrl,
          address, neighborhood, city, state,
          openingTime, closingTime, daysText,
          updatedAt: new Date().toISOString()
        };
        await saveRestaurantToDB(updatedRestaurant);
        onSelectRestaurant?.(updatedRestaurant);
      }

      await saveBrandingToDB({ logoUrl, name: siteTitle, openingTime, closingTime, daysText });
      setMessage(success ? 'Logo, endereço e horário salvos com sucesso!' : 'Erro ao salvar configurações.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Erro ao salvar configurações.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Selecione uma imagem PNG, JPG ou WEBP.');
      return;
    }
    setUploadingLogo(true);
    try {
      const base64 = await compressImage(file, 500, 500, 0.88);
      setLogoUrl(base64);
      await saveBrandingToDB({ logoUrl: base64 });
      const restaurant = await getRestaurantBySlugOrId('urbanburguer');
      if (restaurant) {
        const updatedRestaurant = { ...restaurant, logoUrl: base64, updatedAt: new Date().toISOString() };
        await saveRestaurantToDB(updatedRestaurant);
        onSelectRestaurant?.(updatedRestaurant);
      }
      setMessage('Logo enviada e atualizada com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Falha ao enviar a logo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Adicionar Produto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    try {
      const itemToSave = {
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        image: newProduct.image
      };
      
      const id = await saveMenuItemInDB(itemToSave);
      if (id) {
        setProducts([...products, { id, ...itemToSave }]);
        setNewProduct({ name: '', price: '', category: '', image: '' });
        setMessage('Produto adicionado!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error("Erro ao adicionar produto", error);
    }
  };

  // Deletar Produto
  const handleDeleteProduct = async (id: string) => {
    try {
      const success = await deleteMenuItemInDB(id);
      if (success) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Erro ao deletar produto", error);
    }
  };

  // Adicionar Cupom
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;
    try {
      const docRef = await addDoc(collection(db, 'coupons'), {
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discount)
      });
      setCoupons([...coupons, { id: docRef.id, ...newCoupon }]);
      setNewCoupon({ code: '', discount: '' });
      setMessage('Cupom criado!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Erro ao adicionar cupom", error);
    }
  };

  // Deletar Cupom
  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (error) {
      console.error("Erro ao deletar cupom", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Carregando painel...</p>
      </div>
    );
  }

  // --- TELA DE LOGIN ---
  if (!authProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-full mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Painel Administrativo</h2>
            <p className="text-gray-400 text-sm mt-1">Faça login para gerenciar o site</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="admin@seusite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- LOGADO, MAS SEM PRIVILÉGIO DE SUPER ADMIN ---
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-xl p-8 shadow-2xl text-center space-y-4">
          <div className="inline-flex p-3 bg-red-500/10 text-red-400 rounded-full">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
          <p className="text-gray-400 text-sm">
            A conta <strong className="text-white">{authProfile.email}</strong> está conectada, mas não possui privilégios de Super Admin para acessar este painel.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair e trocar de conta
          </button>
        </div>
      </div>
    );
  }

  // --- PAINEL ADMINISTRATIVO AUTENTICADO ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header do Painel */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
              title="Voltar ao painel"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <Settings className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-bold">Painel de Controle - Urban</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">{authProfile.email}</span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Alerta de Feedback */}
      {message && (
        <div className="bg-emerald-600/10 border-b border-emerald-500/20 text-emerald-400 px-6 py-3 text-center text-sm">
          {message}
        </div>
      )}

      {/* Conteúdo Principal com Abas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Menu Lateral */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-300'}`}
          >
            <Package className="w-5 h-5" />
            <span>Produtos</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'coupons' ? 'bg-indigo-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-300'}`}
          >
            <Tag className="w-5 h-5" />
            <span>Cupons de Desconto</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-300'}`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Logo & Informações</span>
          </button>
        </div>

        {/* Área de Visualização da Aba Ativa */}
        <div className="md:col-span-3 space-y-6">
          
          {/* ABA DE PRODUTOS */}
          {activeTab === 'products' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold">Gerenciar Produtos</h2>
              
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-800">
                <input 
                  type="text" placeholder="Nome do Produto" 
                  value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  required className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <input 
                  type="number" step="0.01" placeholder="Preço (R$)" 
                  value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  required className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <input 
                  type="text" placeholder="Categoria" 
                  value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <input 
                  type="url" placeholder="URL da Imagem" 
                  value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <button type="submit" className="sm:col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-lg flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar Produto
                </button>
              </form>

              <div className="space-y-3">
                {products.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{prod.name}</p>
                      <p className="text-sm text-gray-400">R$ {prod.price} • {prod.category || 'Geral'}</p>
                    </div>
                    <button onClick={() => handleDeleteProduct(prod.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA DE CUPONS */}
          {activeTab === 'coupons' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold">Gerenciar Cupons de Desconto</h2>
              
              <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-800">
                <input 
                  type="text" placeholder="Código do Cupom (ex: DESCONTO10)" 
                  value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                  required className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white uppercase"
                />
                <input 
                  type="number" placeholder="Desconto (%)" 
                  value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                  required className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <button type="submit" className="sm:col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-lg flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Criar Cupom
                </button>
              </form>

              <div className="space-y-3">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-800 rounded-lg">
                    <div>
                      <p className="font-bold text-white tracking-wider">{coupon.code}</p>
                      <p className="text-sm text-gray-400">{coupon.discount}% de desconto</p>
                    </div>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA DE LOGO & CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-8">
              <div>
                <h2 className="text-xl font-semibold">Logo, Endereço e Horário</h2>
                <p className="text-sm text-gray-400 mt-1">Essas informações são usadas no cardápio público do Urban Burger.</p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold"><ImageIcon className="w-5 h-5 text-indigo-400" /> Logo</div>
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center p-4 bg-gray-800/50 border border-gray-800 rounded-xl">
                  <div className="w-28 h-28 rounded-xl bg-gray-950 border border-gray-700 flex items-center justify-center overflow-hidden">
                    {logoUrl ? <img src={logoUrl} alt="Logo atual" className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-600" />}
                  </div>
                  <div className="space-y-2">
                    <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${uploadingLogo ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Enviando...' : 'Enviar nova logo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500">PNG, JPG ou WEBP. A imagem é comprimida antes de ser salva.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold"><MapPin className="w-5 h-5 text-indigo-400" /> Endereço do estabelecimento</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Rua e número</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Rua, número" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bairro</label>
                    <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Bairro" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                    <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Cidade" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estado (UF)</label>
                    <input value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="PI" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold"><Clock className="w-5 h-5 text-indigo-400" /> Horário de funcionamento</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Abertura</label>
                    <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fechamento</label>
                    <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Dias</label>
                    <input value={daysText} onChange={e => setDaysText(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Terça a Domingo" />
                  </div>
                </div>
              </section>

              <button onClick={handleSaveSettings} className="w-full sm:w-auto py-3 px-7 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Save className="w-4 h-4" /> Salvar todas as alterações
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default SuperAdminScreen;
