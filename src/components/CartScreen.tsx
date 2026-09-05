import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trash2, Plus, Minus, Tag, Check, ShoppingCart, Percent, AlertCircle, MessageSquare, FileText, Edit2, Clock } from 'lucide-react';
import { CartItem, ScreenType, Restaurant } from '../types';
import { useLogo, useBranding, isStoreOpen } from '../lib/logoState';
import { useCoupons } from '../lib/couponState';

interface CartScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onUpdateNotes?: (cartId: string, notes: string) => void;
  onBack: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  onChangeScreen: (screen: ScreenType) => void;
  activeRestaurant?: Restaurant | null;
}

export default function CartScreen({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onBack,
  couponCode,
  setCouponCode,
  onChangeScreen,
}: CartScreenProps) {
  const logo = useLogo();
  const branding = useBranding();
  const storeStatus = isStoreOpen(branding);
  const { coupons } = useCoupons();
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  // Calculate items count and subtotal
  const itemsCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);
  const subtotal = cartItems.reduce((acc, curr) => {
    const sidesPrice = curr.selectedSides?.reduce((s, side) => s + side.price, 0) || 0;
    return acc + (curr.menuItem.price + sidesPrice) * curr.quantity;
  }, 0);

  // Validate coupon discount
  let discountValue = 0;
  const activeCoupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
  if (activeCoupon) {
    if (activeCoupon.type === 'percent') {
      discountValue = subtotal * (activeCoupon.discount / 100);
    } else {
      discountValue = Math.min(subtotal, activeCoupon.discount);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountValue);

  const handleApplyCoupon = () => {
    const upperCode = couponInput.trim().toUpperCase();
    if (!upperCode) {
      setCouponMsg({ text: 'Por favor, digite um cupom!', error: true });
      return;
    }

    const found = coupons.find(c => c.code.toUpperCase() === upperCode);
    if (found) {
      if (found.minOrderValue && subtotal < found.minOrderValue) {
        setCouponMsg({ text: `Este cupom requer pedido mínimo de R$ ${found.minOrderValue.toFixed(2).replace('.', ',')}`, error: true });
        return;
      }
      setCouponCode(upperCode);
      const descText = found.type === 'percent' ? `${found.discount}%` : `R$ ${found.discount.toFixed(2).replace('.', ',')}`;
      setCouponMsg({ text: `Cupom ${upperCode} aplicado com sucesso! Desconto de ${descText}.`, error: false });
    } else {
      setCouponMsg({ text: 'Cupom inválido ou expirado.', error: true });
    }
  };

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-36">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5 h-20 flex justify-between items-center px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-primary-orange p-2 hover:bg-white/5 rounded-full outline-none transition-transform active:scale-95 shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="relative p-0.5 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-full shrink-0 shadow-lg shadow-primary-orange/10">
              <img
                alt="Logo"
                className="h-9 w-9 object-cover rounded-full bg-black border border-white/10 aspect-square"
                src={logo}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-tight text-white leading-none">Urban Burguer</span>
              <span className="text-[8px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Hamburgueria Artesanal</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase text-primary-accent tracking-wider bg-primary-orange/10 px-2.5 py-1 rounded-md">
            Meu Carrinho
          </span>
        </div>
      </header>

      {/* Main container */}
      <main className="pt-24 pb-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        {/* Store Status Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
          storeStatus.isOpen
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${
            storeStatus.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left text-xs space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider">{storeStatus.reason}</span>
              <span className={`h-2 w-2 rounded-full ${storeStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <p className="text-[11px] opacity-80">{storeStatus.detail}</p>
          </div>
        </div>

        {/* Title row */}
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-white/5 mt-4">
          <h1 className="font-extrabold text-white text-lg tracking-tight">Meu Carrinho</h1>
          <span className="font-extrabold text-primary-orange text-xs uppercase bg-primary-orange/10 px-3 py-1 rounded-full">
            {itemsCount} {itemsCount === 1 ? 'Item' : 'Itens'}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-surface-container rounded-2xl border border-dashed border-white/5 space-y-4">
            <div className="w-16 h-16 bg-surface-container-high/60 rounded-full flex items-center justify-center mx-auto text-primary-orange">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Seu carrinho está vazio.</p>
            <button
              onClick={() => onChangeScreen('menu')}
              className="px-6 py-2.5 bg-primary-orange text-white text-xs font-bold rounded-xl active:scale-95"
            >
              Explorar Cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Cart items list (7 columns out of 12) */}
            <div className="md:col-span-7 space-y-4">
              <section className="space-y-4">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => {
                    const itemSidesPrice = item.selectedSides?.reduce((s, side) => s + side.price, 0) || 0;
                    const itemFinalPrice = (item.menuItem.price + itemSidesPrice) * item.quantity;
                    
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="flex gap-4 p-4 bg-surface-container-low rounded-2xl border border-white/5 shadow-xl transition-all"
                      >
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high border border-white/5">
                          <img
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            src={item.menuItem.imageUrl}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h3 className="font-extrabold text-white text-sm">
                                {item.menuItem.name}
                              </h3>
                              <button
                                onClick={() => onRemoveItem(item.id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 active:scale-90"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {item.menuItem.description}
                            </p>
                            
                            {/* Suggested sides metadata if attached */}
                            {item.selectedSides && item.selectedSides.length > 0 && (
                              <p className="text-[10px] text-primary-accent italic mt-1">
                                + {item.selectedSides.map((s) => s.name).join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center bg-surface-container-highest rounded-xl p-1 h-8 border border-white/5">
                              <button
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-primary-orange hover:bg-white/5 rounded-lg active:scale-75"
                                title="Diminuir"
                              >
                                <Minus className="w-3 h-3 font-extrabold" />
                              </button>
                              <span className="px-3 text-xs font-black text-white text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-primary-orange hover:bg-white/5 rounded-lg active:scale-75"
                                title="Aumentar"
                              >
                                <Plus className="w-3 h-3 font-extrabold" />
                              </button>
                            </div>

                            <span className="font-extrabold text-sm text-primary-orange">
                              R$ {itemFinalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          {/* Customer Observation section inside cart item - always open and ready to type */}
                          <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                              <span className="flex items-center gap-1.5 text-primary-accent">
                                <MessageSquare className="w-3.5 h-3.5 text-primary-orange" />
                                Observação do item:
                              </span>
                              {item.notes && item.notes.trim() && (
                                <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <Check className="w-3 h-3" /> Salvo
                                </span>
                              )}
                            </div>

                            {/* Quick suggestion tags */}
                            <div className="flex flex-wrap gap-1">
                              {['Sem cebola', 'Ao ponto', 'Bem passado', 'Sem maionese', 'Molho à parte'].map((chip) => {
                                const currentNotes = item.notes || '';
                                const active = currentNotes.includes(chip);
                                return (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => {
                                      let updated = currentNotes;
                                      if (active) {
                                        updated = currentNotes
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter((s) => s !== chip)
                                          .join(', ');
                                      } else {
                                        const clean = currentNotes.trim();
                                        updated = clean ? `${clean}, ${chip}` : chip;
                                      }
                                      onUpdateNotes?.(item.id, updated);
                                    }}
                                    className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                                      active
                                        ? 'bg-primary-orange/25 border-primary-orange text-white shadow-sm'
                                        : 'bg-surface-container border-white/5 text-on-surface-variant/70 hover:text-white hover:border-white/10'
                                    }`}
                                  >
                                    {active ? `✓ ${chip}` : `+ ${chip}`}
                                  </button>
                                );
                              })}
                            </div>

                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => onUpdateNotes?.(item.id, e.target.value)}
                              placeholder="Digite aqui ex: sem sal, tirar picles, molho à parte..."
                              className="w-full bg-black/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-on-surface-variant/40 border border-white/10 focus:border-primary-orange focus:ring-1 focus:ring-primary-orange/30 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </section>
            </div>

            {/* Right Column: Coupons and Calculations (5 columns out of 12) */}
            <div className="md:col-span-5 space-y-6">
              {/* Coupon input section */}
              <section className="bg-surface-container p-4 rounded-2xl border border-white/5 space-y-3">
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-orange" /> Cupom de Desconto
                </h2>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 text-xs text-white placeholder:text-on-surface-variant/40 outline-none transition-all"
                      placeholder="Digite seu cupom (Ex: FLAME20)"
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponMsg(null);
                      }}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-primary-orange text-white text-xs px-5 rounded-xl font-bold active:scale-95 transition-transform hover:bg-opacity-90 shadow-md shadow-primary-orange/10 shrink-0"
                  >
                    Aplicar
                  </button>
                </div>

                {couponMsg && (
                  <div
                    className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg ${
                      couponMsg.error
                        ? 'bg-red-500/10 text-red-300 border border-red-500/15'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15'
                    }`}
                  >
                    {couponMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                    <span>{couponMsg.text}</span>
                  </div>
                )}

                {/* Lista de cupons ativos para o cliente visualizar e aplicar diretamente */}
                {coupons.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 flex items-center gap-1">
                      Cupons disponíveis da loja:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {coupons.map((c) => {
                        const isSelected = couponCode.toUpperCase() === c.code.toUpperCase();
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCouponInput(c.code);
                              if (c.minOrderValue && subtotal < c.minOrderValue) {
                                setCouponMsg({ text: `Este cupom requer pedido mínimo de R$ ${c.minOrderValue.toFixed(2).replace('.', ',')}`, error: true });
                              } else {
                                setCouponCode(c.code);
                                const descText = c.type === 'percent' ? `${c.discount}%` : `R$ ${c.discount.toFixed(2).replace('.', ',')}`;
                                setCouponMsg({ text: `Cupom ${c.code} aplicado com sucesso! Desconto de ${descText}.`, error: false });
                              }
                            }}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-primary-orange text-white border-primary-orange shadow-md shadow-primary-orange/20 scale-105'
                                : 'bg-surface-container-low border-white/10 text-primary-accent hover:border-primary-orange/50 hover:text-white'
                            }`}
                          >
                            <Tag className="w-3 h-3 text-primary-orange" />
                            <span className="font-mono uppercase">{c.code}</span>
                            <span className="opacity-90">({c.type === 'percent' ? `${c.discount}%` : `R$ ${c.discount}`})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Bill calculation details */}
              <section className="bg-surface-container-highest/60 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {discountValue > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Desconto ({couponCode})
                    </span>
                    <span className="font-extrabold">- R$ {discountValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-white uppercase tracking-wider">Total</span>
                  <span className="font-black text-xl text-primary-orange">
                    R$ {finalTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Checkout Sticky Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-3xl border-t border-white/15 pb-safe rounded-t-[2.5rem] shadow-2xl max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2">
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex flex-col shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Total Final</span>
              <span className="text-xl font-black text-primary-orange">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <button
              onClick={() => onChangeScreen('register')}
              className="flex-1 h-14 bg-primary-orange text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary-orange/20 outline-none"
            >
              Finalizar Pedido
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
