import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Tag, Palette, Store, Lock, LogIn, Plus, Trash2, Package, Upload } from 'lucide-react';
import { auth, db, storage, getProducts, saveMenuItemInDB, deleteMenuItemInDB } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useCoupons, saveCouponToDB, deleteCouponFromDB, Coupon } from '../lib/couponState';
import { useLogo, saveLogoToDB, useBranding, saveBrandingToDB } from '../lib/logoState';

interface SuperAdminScreenProps {
  onBack: () => void;
}

export default function SuperAdminScreen({ onBack }: SuperAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'coupons' | 'branding'>('config');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Estados de Login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Estados da Aba Geral (Produtos)
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [productMessage, setProductMessage] = useState('');

  // Estados da Aba Cupons
  const { coupons, refreshCoupons } = useCoupons();
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'percentage' as 'percentage' | 'fixed', minSpend: '' });
  const [couponMessage, setCouponMessage] = useState('');

  // Estados da Aba Aparência (Nome e Logo)
  const { logoUrl, refreshLogo } = useLogo();
  const { siteTitle, refreshBranding } = useBranding();
  const [titleInput, setTitleInput] = useState(siteTitle || '');
  const [logoInput, setLogoInput] = useState(logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
      if (user) {
        loadProductsData();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (siteTitle) setTitleInput(siteTitle);
    if (logoUrl) setLogoInput(logoUrl);
  }, [siteTitle, logoUrl]);

  const loadProductsData = async () => {
    const prods = await getProducts();
    setProducts(prods);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (error: any) {
      setAuthError('E-mail ou senha incorretos no Firebase Auth.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Upload auxiliar para o Storage
  const uploadImageToStorage = async (file: File, folder: string): Promise<string> => {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  // Ações de Produtos
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    setUploadingProductImg(true);
    try {
      let imageUrl = newProduct.image;
      if (productImageFile) {
        imageUrl = await uploadImageToStorage(productImageFile, 'products');
      }

      const item = {
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category || 'Geral',
        image: imageUrl
      };

      const id = await saveMenuItemInDB(item);
      if (id) {
        setProducts([...products, { id, ...item }]);
        setNewProduct({ name: '', price: '', category: '', image: '' });
        setProductImageFile(null);
        setProductMessage('Produto adicionado com sucesso!');
        setTimeout(() => setProductMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      setProductMessage('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const success = await deleteMenuItemInDB(id);
    if (success) {
      setProducts(products.filter(p => p.id !== id));
      setProductMessage('Produto removido.');
      setTimeout(() => setProductMessage(''), 3000);
    }
  };

  // Ações de Cupons
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;
    const couponData = {
      code: newCoupon.code.toUpperCase(),
      discount: Number(newCoupon.discount),
      type: newCoupon.type,
      minSpend: newCoupon.minSpend ? Number(newCoupon.minSpend) : 0
    };
    const id = await saveCouponToDB(couponData);
    if (id) {
      refreshCoupons();
      setNewCoupon({ code: '', discount: '', type: 'percentage', minSpend: '' });
      setCouponMessage('Cupom criado com sucesso!');
      setTimeout(() => setCouponMessage(''), 3000);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const success = await deleteCouponFromDB(id);
    if (success) {
      refreshCoupons();
      setCouponMessage('Cupom excluído.');
      setTimeout(() => setCouponMessage(''), 3000);
    }
  };

  // Ações de Aparência (Nome e Logo por Upload)
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingLogo(true);
    try {
      await saveBrandingToDB(titleInput);
      
      let finalLogoUrl = logoInput;
      if (logoFile) {
        finalLogoUrl = await uploadImageToStorage(logoFile, 'branding');
        setLogoInput(finalLogoUrl);
      }

      if (finalLogoUrl !== undefined) {
        await saveLogoToDB(finalLogoUrl);
      }

      refreshBranding();
      refreshLogo();
      setBrandingMessage('Alterações de aparência salvas com sucesso!');
      setTimeout(() => setBrandingMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar branding:', error);
      setBrandingMessage('Erro ao enviar imagem da logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loadingAuth) {
    return <div className="p-8 text-center text-gray-400">Verificando credenciais...</div>;
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors" title="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Lock className="w-8 h-8 text-indigo-400 mx-auto" />
          <div className="w-9" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Painel Super Admin</h2>
          <p className="text-xs text-gray-400">Autentique-se com uma conta de Super Administrador do Firebase.</p>
        </div>
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
            {authError}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">E-mail</label>
            <input 
              type="email" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Senha</label>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
            <LogIn className="w-4 h-4" /> Entrar no Super Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-colors text-gray-300" title="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" /> Painel Super Admin
            </h1>
            <p className="text-sm text-gray-400">Logado como: <span className="text-indigo-400">{currentUser.email}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <Store className="w-4 h-4" /> Geral (Produtos)
            </button>
            <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <Tag className="w-4 h-4" /> Cupons
            </button>
            <button onClick={() => setActiveTab('branding')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'branding' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <Palette className="w-4 h-4" /> Aparência
            </button>
          </div>

          <button onClick={handleLogout} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors">
            Sair
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Gerenciamento do Cardápio e Produtos</h2>
              <p className="text-sm text-gray-400">Cadastre novos itens fazendo upload direto de imagens para o armazenamento.</p>
            </div>

            {productMessage && (
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-xl text-center">
                {productMessage}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
              <input 
                type="text" 
                placeholder="Nome do Produto" 
                value={newProduct.name} 
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                required 
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <input 
                type="number" 
                step="0.01" 
                placeholder="Preço (R$)" 
                value={newProduct.price} 
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                required 
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <input 
                type="text" 
                placeholder="Categoria (ex: Lanches, Bebidas)" 
                value={newProduct.category} 
                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-medium text-gray-400 mb-1">Foto do Produto (Arquivo)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setProductImageFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-indigo-400 hover:file:bg-gray-700"
                />
              </div>
              <button 
                type="submit" 
                disabled={uploadingProductImg}
                className="sm:col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {uploadingProductImg ? <Upload className="w-4 h-4 animate-bounce" /> : <Plus className="w-4 h-4" />}
                {uploadingProductImg ? 'Enviando imagem e cadastrando...' : 'Cadastrar Produto com Upload'}
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-md font-medium text-white">Produtos Cadastrados ({products.length})</h3>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum produto cadastrado até o momento.</p>
              ) : (
                products.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-3.5 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-gray-800" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-gray-600">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white text-sm">{prod.name}</p>
                        <p className="text-xs text-gray-400">R$ {Number(prod.price).toFixed(2)} • <span className="text-indigo-400">{prod.category}</span></p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteProduct(prod.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Gerenciamento de Cupons</h2>
              <p className="text-sm text-gray-400">Crie novos códigos promocionais e remova cupons ativos.</p>
            </div>

            {couponMessage && (
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-xl text-center">
                {couponMessage}
              </div>
            )}

            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
              <input 
                type="text" 
                placeholder="Código (ex: PROMO10)" 
                value={newCoupon.code} 
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                required 
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm uppercase focus:outline-none focus:border-indigo-500"
              />
              <input 
                type="number" 
                placeholder="Valor do Desconto" 
                value={newCoupon.discount} 
                onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                required 
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <select 
                value={newCoupon.type} 
                onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
              <input 
                type="number" 
                placeholder="Gasto Mínimo (Opcional)" 
                value={newCoupon.minSpend} 
                onChange={e => setNewCoupon({...newCoupon, minSpend: e.target.value})}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="sm:col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Criar Cupom de Desconto
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-md font-medium text-white">Cupons Ativos ({coupons.length})</h3>
              {coupons.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum cupom cadastrado.</p>
              ) : (
                coupons.map(coupon => (
                  <div key={coupon.id} className="flex items-center justify-between p-3.5 bg-gray-950 border border-gray-800 rounded-xl">
                    <div>
                      <p className="font-bold text-white text-sm">{coupon.code}</p>
                      <p className="text-xs text-gray-400">
                        {coupon.type === 'percentage' ? `${coupon.discount}% de desconto` : `R$ ${coupon.discount} de desconto`} 
                        {coupon.minSpend ? ` • Mín: R$ ${coupon.minSpend}` : ''}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <form onSubmit={handleSaveBranding} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Identidade Visual, Nome e Logotipo</h2>
              <p className="text-sm text-gray-400">Mude o nome do restaurante e faça upload do logotipo oficial via arquivo.</p>
            </div>

            {brandingMessage && (
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-xl text-center">
                {brandingMessage}
              </div>
            )}

            <div className="space-y-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Restaurante</label>
                <input 
                  type="text" 
                  value={titleInput} 
                  onChange={e => setTitleInput(e.target.value)}
                  placeholder="Ex: Urbano Burguer"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fazer Upload do Logotipo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-indigo-400 hover:file:bg-gray-700"
                />
              </div>

              {(logoFile || logoInput) && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-gray-400">Pré-visualização da Logo:</span>
                  <img 
                    src={logoFile ? URL.createObjectURL(logoFile) : logoInput} 
                    alt="Logo Preview" 
                    className="w-12 h-12 object-contain bg-gray-900 rounded-lg border border-gray-800 p-1" 
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={uploadingLogo}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {uploadingLogo ? <Upload className="w-4 h-4 animate-bounce" /> : <Palette className="w-4 h-4" />}
                {uploadingLogo ? 'Enviando arquivo...' : 'Salvar Alterações de Aparência'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
