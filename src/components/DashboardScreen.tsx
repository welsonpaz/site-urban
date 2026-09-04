import React, { useState, useEffect } from 'react';
import { db, getProducts, saveMenuItemInDB, deleteMenuItemInDB } from '../lib/firebase';
import { Package, Plus, Trash2, UtensilsCrossed } from 'lucide-react';

export default function DashboardScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const prods = await getProducts();
    setProducts(prods);
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const itemToSave = {
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category || 'Geral',
      image: newProduct.image
    };

    const id = await saveMenuItemInDB(itemToSave);
    if (id) {
      setProducts([...products, { id, ...itemToSave }]);
      setNewProduct({ name: '', price: '', category: '', image: '' });
      setMessage('Produto adicionado ao cardápio com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const success = await deleteMenuItemInDB(id);
    if (success) {
      setProducts(products.filter(p => p.id !== id));
      setMessage('Produto removido.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Carregando painel operacional...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 text-gray-100">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <UtensilsCrossed className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">Painel da Loja (Dashboard)</h1>
          <p className="text-sm text-gray-400">Gerencie o cardápio e os produtos disponíveis para venda</p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      {/* Formulário de Adição de Produto */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" /> Adicionar Novo Item ao Cardápio
        </h2>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Nome do Produto (ex: X-Burger)" 
            value={newProduct.name} 
            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            required 
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <input 
            type="number" 
            step="0.01" 
            placeholder="Preço (R$)" 
            value={newProduct.price} 
            onChange={e => setNewProduct({...newProduct, price: e.target.value})}
            required 
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <input 
            type="text" 
            placeholder="Categoria (ex: Lanches, Bebidas)" 
            value={newProduct.category} 
            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <input 
            type="url" 
            placeholder="URL da Imagem do Produto" 
            value={newProduct.image} 
            onChange={e => setNewProduct({...newProduct, image: e.target.value})}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            type="submit" 
            className="sm:col-span-2 py-3 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" /> Salvar Produto no Cardápio
          </button>
        </form>
      </div>

      {/* Lista de Produtos Ativos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Itens Cadastrados no Cardápio ({products.length})</h2>
        
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum produto cadastrado até o momento.</p>
          ) : (
            products.map(prod => (
              <div key={prod.id} className="flex items-center justify-between p-3.5 bg-gray-800/50 border border-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {prod.image && (
                    <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-md" />
                  )}
                  <div>
                    <p className="font-medium text-white">{prod.name}</p>
                    <p className="text-sm text-gray-400">R$ {Number(prod.price).toFixed(2)} • <span className="text-indigo-400">{prod.category || 'Geral'}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteProduct(prod.id)} 
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Excluir produto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { DashboardScreen };
