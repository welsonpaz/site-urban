import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import ProductImageUpload from './admin/ProductImageUpload';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface DashboardScreenProps {
  onNavigate?: (screen: string) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado do formulário do produto
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Lanches',
    imageUrl: ''
  });

  // Buscar produtos do Firestore
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const items: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(items);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingId(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: 'Lanches',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price) || 0,
      category: productForm.category,
      imageUrl: productForm.imageUrl,
      updatedAt: new Date()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
      }
      await fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Erro ao remover produto.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
      {/* Topo do Painel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel da Loja • Cardápio</h1>
          <p className="text-xs text-zinc-400">Gerencie os lanches, bebidas e fotos exibidas no cardápio público.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          >
            + Novo Produto
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('superadmin')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
            >
              Ir para Super Admin
            </button>
          )}
        </div>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">Carregando itens do cardápio...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 space-y-3">
          <p className="text-base font-medium">Nenhum produto cadastrado ainda.</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-xs text-orange-400 hover:text-orange-300 underline"
          >
            Cadastrar o primeiro item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-700">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">Sem Foto</div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-md">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>
                <p className="text-sm font-semibold text-orange-400">R$ {item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg text-zinc-200 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteProduct(item.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-xs rounded-lg text-red-400 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição com o Componente ProductImageUpload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Item</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: X-Salada Duplo"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="25.90"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Lanches">Lanches</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Sobremesas">Sobremesas</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ingredientes e detalhes..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Upload da Imagem em Base64 */}
              <ProductImageUpload
                currentImage={productForm.imageUrl}
                onImageChange={(base64) => setProductForm({ ...productForm, imageUrl: base64 })}
              />

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                  {saving ? 'Salvando...' : 'Salvar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardScreen;
