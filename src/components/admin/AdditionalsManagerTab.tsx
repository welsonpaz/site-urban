import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Check, X, DollarSign, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdditionalOption, Restaurant } from '../../types';
import { getAdditionalsByRestaurant, saveAdditionalForRestaurant, deleteAdditionalForRestaurant } from '../../lib/tenantService';

interface AdditionalsManagerTabProps {
  restaurant: Restaurant;
}

export default function AdditionalsManagerTab({ restaurant }: AdditionalsManagerTabProps) {
  const [additionals, setAdditionals] = useState<AdditionalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<AdditionalOption>>({
    name: '',
    price: 0,
    category: '',
    isActive: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAdditionalsByRestaurant(restaurant.id);
      setAdditionals(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurant.id]);

  const handleOpenAdd = () => {
    setFormData({
      id: `add-${Date.now()}`,
      restaurantId: restaurant.id,
      name: '',
      price: 5.0,
      category: restaurant.categories?.[0] || '',
      isActive: true
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (opt: AdditionalOption) => {
    setFormData({ ...opt });
    setEditingId(opt.id);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || formData.price === undefined || formData.price < 0) {
      alert('Preencha o nome do adicional e um valor válido.');
      return;
    }

    try {
      const toSave: AdditionalOption = {
        id: editingId || formData.id || `add-${Date.now()}`,
        restaurantId: restaurant.id,
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category || '',
        isActive: formData.isActive !== false
      };

      await saveAdditionalForRestaurant(toSave);
      alert('Adicional salvo com sucesso!');
      setIsAdding(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar adicional.');
    }
  };

  const handleToggle = async (opt: AdditionalOption) => {
    try {
      const updated = { ...opt, isActive: !opt.isActive };
      await saveAdditionalForRestaurant(updated);
      setAdditionals(prev => prev.map(a => a.id === opt.id ? updated : a));
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar status.');
    }
  };

  const handleDelete = async (opt: AdditionalOption) => {
    if (!confirm(`Deseja remover o adicional "${opt.name}"?`)) return;
    try {
      await deleteAdditionalForRestaurant(opt.id);
      setAdditionals(prev => prev.filter(a => a.id !== opt.id));
    } catch (err) {
      console.error(err);
      alert('Erro ao remover adicional.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-orange" />
            Adicionais e Extras • {restaurant.name}
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            Cadastre complementos (ex: Bacon Extra, Queijo Duplo, Bordas Recheadas, Molhos Especiais).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 flex items-center gap-1.5 active:scale-95 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Novo Adicional
        </button>
      </div>

      {/* Form: Add or Edit */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-surface-container-low p-5 rounded-2xl border border-primary-orange/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              {editingId ? 'Editar Adicional' : 'Cadastrar Novo Adicional'}
            </h3>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="text-on-surface-variant hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                Nome do Adicional *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bacon Crocante Artesanal Extra, Borda de Catupiry..."
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                Preço Adicional (R$) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                placeholder="5.00"
                value={formData.price ?? 0}
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-3.5 py-1.5 bg-surface-container hover:bg-white/5 rounded-xl text-xs font-bold text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-primary-orange hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              Salvar Adicional
            </button>
          </div>
        </form>
      )}

      {/* Additionals List */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 space-y-2 shadow-md">
        <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">
          Adicionais Ativos no Cardápio ({additionals.length})
        </h3>

        {additionals.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">
            Nenhum adicional cadastrado ainda. Clique em "Novo Adicional" acima.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {additionals.map(opt => (
              <div
                key={opt.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  opt.isActive
                    ? 'bg-surface-container-lowest border-white/5'
                    : 'bg-surface-container-lowest/40 border-white/5 opacity-60'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{opt.name}</h4>
                  <span className="text-xs font-black text-primary-orange">
                    + R$ {opt.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(opt)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-white"
                    title={opt.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {opt.isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">
                        Pausado
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(opt)}
                    className="p-1.5 bg-surface-container hover:bg-white/10 rounded-lg text-on-surface-variant"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(opt)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
