import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Tag, Store, Plus, Trash2, Package } from 'lucide-react';
import { db, getProducts, saveMenuItemInDB, deleteMenuItemInDB } from '../lib/firebase';
import { useCoupons, saveCouponToDB, deleteCouponFromDB, Coupon } from '../lib/couponState';

interface DashboardScreenProps {
  onBack: () => void;
}

export default function DashboardScreen({ onBack }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'coupons'>('config');

  // Estados da Aba Geral (Produtos)
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });
  const [productMessage, setProductMessage] = useState('');

  // Estados da Aba Cupons
  const { coupons, refreshCoupons } = useCoupons();
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'percentage' as 'percentage' | 'fixed', minSpend: '' });
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    loadProductsData();
  }, []);

  const loadProductsData = async () => {
    const prods = await getProducts();
    setProducts(prods);
  };

  // Ações de Produtos
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const item = {
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category || 'Geral',
      image: newProduct.image
    };
    const id = await saveMenuItemInDB(item);
    if (id) {
      setProducts([...products, { id, ...item }]);
      setNewProduct({ name: '', price: '', category: '', image: '' });
      setProductMessage('Produto adicionado com sucesso!');
      setTimeout(() => setProductMessage(''), 3000);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-100">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-colors text-gray-300" title="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" /> Painel Admin
            </h1>
            <p className="text-sm text-gray-400">Gerencie o cardápio e cupons do estabelecimento.</p>
          </div>
        </div>

        <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800">
          <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <Store className="w-4 h-4" /> Geral (Produtos)
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <Tag className="w-4 h-4" /> Cupons
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* ABA 1: GERAL (CADASTRO E GESTÃO DE PRODUTOS) */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Gerenciamento do Cardápio</h2>
              <p className="text-sm text-gray-400">Adicione novos itens ou remova produtos existentes do cardápio.</p>
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
              <input 
                type="url" 
                placeholder="URL da Imagem do Produto" 
                value={newProduct.image} 
                onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="sm:col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Cadastrar Produto no Cardápio
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
                      {prod.image && <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-lg" />}
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

        {/* ABA 2: CUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Gerenciamento de Cupons</h2>
              <p className="text-sm text-gray-400">Crie códigos de desconto e controle os cupons ativos.</p>
            </div>

            {couponMessage && (
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-xl text-center">
                {couponMessage}
              </div>
            )}

            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
              <input 
                type="text" 
                placeholder="Código (ex: DESCONTO10)" 
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

      </div>
    </div>
  );
}
