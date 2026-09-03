import React, { useState } from 'react';
import { Layers, Plus, Edit3, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { Restaurant } from '../../types';
import { saveRestaurantToDB } from '../../lib/tenantService';

interface CategoriesManagerTabProps {
  restaurant: Restaurant;
  onCategoriesUpdated: (categories: string[]) => void;
}

export default function CategoriesManagerTab({ restaurant, onCategoriesUpdated }: CategoriesManagerTabProps) {
  const [categories, setCategories] = useState<string[]>(restaurant.categories || ['Hambúrgueres', 'Bebidas']);
  const [newCatName, setNewCatName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;

    if (categories.includes(clean)) {
      alert('Essa categoria já existe no cardápio!');
      return;
    }

    const updated = [...categories, clean];
    setSaving(true);
    try {
      await saveRestaurantToDB({
        ...restaurant,
        categories: updated
      });
      setCategories(updated);
      onCategoriesUpdated(updated);
      setNewCatName('');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (idx: number, name: string) => {
    setEditingIdx(idx);
    setEditingName(name);
  };

  const handleSaveEdit = async (idx: number) => {
    const clean = editingName.trim();
    if (!clean) return;

    const updated = [...categories];
    updated[idx] = clean;

    setSaving(true);
    try {
      await saveRestaurantToDB({
        ...restaurant,
        categories: updated
      });
      setCategories(updated);
      onCategoriesUpdated(updated);
      setEditingIdx(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao renomear categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    const target = categories[idx];
    if (!confirm(`Deseja remover a categoria "${target}"? Os produtos dessa categoria continuarão cadastrados, mas precisarão ser reatribuídos.`)) {
      return;
    }

    const updated = categories.filter((_, i) => i !== idx);
    setSaving(true);
    try {
      await saveRestaurantToDB({
        ...restaurant,
        categories: updated
      });
      setCategories(updated);
      onCategoriesUpdated(updated);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const updated = [...categories];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setSaving(true);
    try {
      await saveRestaurantToDB({
        ...restaurant,
        categories: updated
      });
      setCategories(updated);
      onCategoriesUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-orange" />
              Gestão de Categorias • {restaurant.name}
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Crie as seções do seu cardápio (ex: Pizzas Salgadas, Hambúrgueres Artesanais, Bebidas).
            </p>
          </div>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Nome da nova categoria (ex: Sobremesas Gourmet)..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white placeholder-on-surface-variant/40 focus:border-primary-orange focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !newCatName.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Plus className="w-4 h-4" /> Adicionar Categoria
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 space-y-2 shadow-md">
        <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-wider px-1">
          Ordem das Categorias no Cardápio ({categories.length})
        </h3>

        <div className="space-y-2 pt-1">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-white/5 hover:border-white/10 transition-colors"
            >
              {editingIdx === idx ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-surface-container-high border border-primary-orange/50 rounded-lg text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(idx)}
                    className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"
                    title="Confirmar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-xs font-mono font-bold text-on-surface-variant">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-extrabold text-white">{cat}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 bg-surface-container hover:bg-white/10 rounded-lg text-on-surface-variant disabled:opacity-20"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === categories.length - 1}
                  className="p-1.5 bg-surface-container hover:bg-white/10 rounded-lg text-on-surface-variant disabled:opacity-20"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(idx, cat)}
                  className="p-1.5 bg-surface-container hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-white"
                  title="Renomear"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
