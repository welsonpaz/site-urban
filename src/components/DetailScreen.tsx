import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Star, Plus, Minus, Check, Leaf, ShoppingBag, Flame, Layers, Award, Heart, MessageSquare } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { SUGGESTED_SIDES, EXTRA_OPTIONS } from '../data';
import { useLogo } from '../lib/logoState';

interface DetailScreenProps {
  product: MenuItem;
  onBack: () => void;
  onAddToCart: (item: MenuItem, qty: number, sides: MenuItem[], notes?: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export default function DetailScreen({
  product,
  onBack,
  onAddToCart,
  favorites,
  toggleFavorite,
}: DetailScreenProps) {
  const logo = useLogo();
  const [quantity, setQuantity] = useState(1);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const [addSuccessBtn, setAddSuccessBtn] = useState(false);

  const QUICK_NOTES_TAGS = [
    'Sem cebola',
    'Sem picles',
    'Sem maionese',
    'Ao ponto',
    'Bem passado',
    'Molho à parte'
  ];

  const handleToggleQuickNote = (tag: string) => {
    if (notes.includes(tag)) {
      const updated = notes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== tag)
        .join(', ');
      setNotes(updated);
    } else {
      const clean = notes.trim();
      setNotes(clean ? `${clean}, ${tag}` : tag);
    }
  };

  // Helper icons mapper for ingredients
  const getIngredientIcon = (iconName: string) => {
    switch (iconName) {
      case 'Beef':
        return <Flame className="w-5 h-5 text-primary-orange" />;
      case 'Cookie':
        return <Award className="w-5 h-5 text-primary-orange" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-primary-orange" />;
      case 'Leaf':
      default:
        return <Leaf className="w-5 h-5 text-primary-orange" />;
    }
  };

  const handleToggleSide = (side: MenuItem) => {
    if (selectedSides.some((s) => s.id === side.id)) {
      setSelectedSides(selectedSides.filter((s) => s.id !== side.id));
    } else {
      setSelectedSides([...selectedSides, side]);
    }
  };

  // Calculations
  const basePrice = product.price;
  const sidesPrice = selectedSides.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = (basePrice + sidesPrice) * quantity;

  const handleShare = () => {
    setShareToast(true);
    // Copy fake url or trigger share
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleAddSubmit = () => {
    setAddSuccessBtn(true);
    setTimeout(() => {
      onAddToCart(product, quantity, selectedSides, notes);
      setAddSuccessBtn(false);
      onBack(); // return to menu
    }, 1200);
  };

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-36">
      {/* Top AppBar */}
      <nav className="fixed top-0 w-full z-50 bg-dark-bg/85 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-5 h-16 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem]">
        <button
          onClick={onBack}
          className="active:scale-95 transition-transform text-primary-orange p-2 hover:bg-white/5 rounded-full outline-none"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onBack()}>
          <div className="relative p-0.5 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-full shrink-0">
            <img
              alt="Logo"
              className="h-9 w-9 object-cover rounded-full bg-black border border-white/5 aspect-square"
              src={logo}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-tight text-white leading-none">Urban Burguer</span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Artesanal</span>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="active:scale-95 transition-transform text-primary-orange p-2 hover:bg-white/5 rounded-full outline-none"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </nav>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface-container-high border border-primary-orange/30 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-orange rounded-full animate-ping" />
          Link copiado! Compartilhe com seus amigos.
        </div>
      )}

      {/* Main detail content */}
      <div className="max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-16 px-5 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-6">
          {/* Left Column: Image Card */}
          <div>
            <section className="relative w-full h-[260px] sm:h-[320px] md:h-[400px] overflow-hidden rounded-3xl bg-surface-container shadow-2xl border border-white/5">
              <motion.img
                initial={{ scale: 1.05, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                alt={product.name}
                className="w-full h-full object-cover hero-mask"
                referrerPolicy="no-referrer"
                src={product.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/45 to-transparent" />
              <div className="absolute bottom-6 left-5 right-5 flex justify-between items-end">
                <div className="bg-surface-container-high/90 backdrop-blur-md rounded-2xl p-3 shadow-lg inline-flex items-center gap-2 border border-white/10">
                  <Star className="w-4 h-4 text-primary-orange fill-primary-orange" />
                  <span className="font-extrabold text-white text-sm">{product.rating}</span>
                  <span className="text-xs text-on-surface-variant font-medium">({product.ratingCount} avaliações)</span>
                </div>

                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="bg-surface-container-high/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/10 active:scale-90 transition-transform"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(product.id) ? 'text-primary-orange fill-primary-orange' : 'text-on-surface-variant'
                    }`}
                  />
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Title, Ingredients and Configuration details */}
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">{product.name}</h1>
                <p className="text-on-surface-variant text-sm mt-2 font-medium leading-relaxed">{product.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl font-black text-primary-orange uppercase block">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* New Ingredients List */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary-orange rounded-full" />
                  Ingredientes Frescos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 bg-surface-container-low/60 rounded-xl border border-white/5"
                    >
                      {getIngredientIcon(ing.icon)}
                      <span className="text-xs font-semibold text-on-surface">{ing.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Custom Extra options */}
            {product.category === 'Hambúrgueres' && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary-orange rounded-full" />
                  Adicionais Extras
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-container-low/40 p-3 rounded-2xl border border-white/5">
                  {EXTRA_OPTIONS.map((opt) => {
                    const isSelected = selectedSides.some((s) => s.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const sideMenuItem: MenuItem = {
                            id: opt.id,
                            name: opt.name,
                            price: opt.price,
                            description: 'Adicional',
                            imageUrl: '',
                            category: 'Porções',
                            rating: 5,
                            ratingCount: '0'
                          };
                          handleToggleSide(sideMenuItem);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all outline-none ${
                          isSelected
                            ? 'bg-primary-orange/15 border-primary-orange/50 text-white'
                            : 'bg-surface-container-low/20 border-white/5 text-on-surface-variant hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary-orange border-primary-orange text-white' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold text-white">{opt.name}</span>
                        </div>
                        <span className="text-xs font-black text-primary-orange">
                          +R$ {opt.price.toFixed(2).replace('.', ',')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer Observations / Special Instructions Section */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary-orange rounded-full" />
                Observações do Cliente
              </h3>
              
              <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                  <MessageSquare className="w-4 h-4 text-primary-orange" />
                  <span>Alguma instrução para o preparo do seu pedido?</span>
                </div>

                {/* Quick suggestion tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_NOTES_TAGS.map((tag) => {
                    const active = notes.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleQuickNote(tag)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all outline-none ${
                          active
                            ? 'bg-primary-orange/20 border-primary-orange text-white shadow-sm'
                            : 'bg-surface-container border-white/5 text-on-surface-variant hover:text-white hover:border-white/10'
                        }`}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Ponto da carne bem passado, retirar cebola, molho à parte..."
                  rows={2}
                  className="w-full bg-surface-container rounded-xl p-3 text-xs text-white placeholder:text-on-surface-variant/40 border border-white/5 focus:border-primary-orange/50 focus:ring-1 focus:ring-primary-orange/30 outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Quantity Selector Option inside a beautifully-styled card */}
            <div className="flex items-center justify-between bg-surface-container p-4 rounded-xl shadow-sm border border-white/5">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">Quantidade</span>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-primary-orange shadow-sm active:scale-90 transition-all border border-white/10"
                  title="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-white text-base min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-orange text-white shadow-sm active:scale-90 transition-all"
                  title="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Cart Bar for Detailed Screen */}
      <footer className="fixed bottom-0 w-full z-50 p-5 bg-dark-bg/90 backdrop-blur-2xl border-t border-white/5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 rounded-t-3xl shadow-xl">
        <button
          onClick={handleAddSubmit}
          disabled={addSuccessBtn}
          className={`w-full h-14 font-bold rounded-2xl flex items-center justify-between px-6 shadow-xl active:scale-[0.98] transition-all duration-300 outline-none ${
            addSuccessBtn
              ? 'bg-emerald-600 text-white'
              : 'bg-primary-orange text-white hover:bg-opacity-95 shadow-primary-orange/20'
          }`}
        >
          {addSuccessBtn ? (
            <span className="mx-auto flex items-center gap-2 justify-center font-bold text-sm tracking-wide">
              <Check className="w-5 h-5 animate-bounce" /> Adicionado ao Carrinho!
            </span>
          ) : (
            <>
              <span className="font-extrabold text-sm uppercase tracking-wider">Adicionar ao Carrinho</span>
              <div className="flex items-center gap-1.5 bg-black/25 px-3.5 py-1.5 rounded-xl">
                <span className="text-[10px] text-primary-accent uppercase font-bold">Total</span>
                <span className="font-black text-sm text-white">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
