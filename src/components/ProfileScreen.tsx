import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Mail, MapPin, Tag, Smartphone, Shield, LogOut, Heart, ChevronRight, Database, Check } from 'lucide-react';
import { ScreenType, Restaurant } from '../types';
import { useLogo, useBranding } from '../lib/logoState';
import { useCoupons } from '../lib/couponState';

interface ProfileScreenProps {
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  onOpenSuperAdmin?: () => void;
  activeRestaurant?: Restaurant | null;
}

export default function ProfileScreen({ onBack, onChangeScreen, onOpenSuperAdmin, activeRestaurant }: ProfileScreenProps) {
  const defaultLogo = useLogo();
  const defaultBranding = useBranding();

  const logo = activeRestaurant?.logoUrl || defaultLogo;
  const branding = activeRestaurant ? {
    name: activeRestaurant.name,
    subtitle: activeRestaurant.subtitle || '',
    tag: activeRestaurant.tag || '',
  } : defaultBranding;

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const { coupons } = useCoupons();

  const handleCopyCoupon = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Cupom "${code}" copiado!`);
    }
  };

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
          <h1 className="font-extrabold text-base text-white">Meu Perfil</h1>
        </div>
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChangeScreen('menu')}>
          <div className="relative p-0.5 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-full shrink-0 shadow-md shadow-primary-orange/10">
            <img
              alt="Logo"
              className="h-9 w-9 object-cover rounded-full bg-black border border-white/10 aspect-square"
              src={logo}
            />
          </div>
          <div className="flex flex-col text-left font-sans">
            <span className="text-xs font-black tracking-tight text-white leading-none">{branding.name}</span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Artesanal</span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        {/* User Card */}
        <section className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex items-center gap-4 mt-4">
          <div className="w-14 h-14 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange border border-primary-orange/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Welson Paz</h2>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-0.5">
              <Mail className="w-3.5 h-3.5 text-primary-accent" />
              <span>WelsonPaz@gmail.com</span>
            </div>
          </div>
        </section>

        {/* Address & Info Details */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-orange" /> Endereços Cadastrados
          </h3>

          <div
            onClick={() => onChangeScreen('checkout')}
            className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 flex justify-between items-center cursor-pointer hover:border-white/10 active:scale-[0.99] transition-all"
          >
            <div className="space-y-0.5 text-xs text-on-surface-variant">
              <p className="font-extrabold text-white">Casa (Padrão)</p>
              <p>Rua das Gastronomias, 123 - Apt 42, Bloco B</p>
              <p>Jardim Gourmet, São Paulo - SP</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary-orange" />
          </div>
        </section>

        {/* Valid Coupons list */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-orange" /> Cupons Disponíveis
          </h3>

          <div className="space-y-3">
            {coupons.length === 0 ? (
              <div className="bg-surface-container-low/50 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-xs text-on-surface-variant/70 italic">Nenhum cupom disponível no momento.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const desc = coupon.description || (coupon.type === 'percent' 
                  ? `${coupon.discount}% de desconto` 
                  : `R$ ${coupon.discount.toFixed(2).replace('.', ',')} de desconto`);
                
                return (
                  <div
                    key={coupon.id || coupon.code}
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className="bg-surface-container-low/70 p-3 rounded-xl border border-dashed border-white/10 flex justify-between items-center cursor-pointer hover:border-white/20 active:scale-[0.99] transition-all group"
                  >
                    <div className="space-y-1">
                      <span className="inline-block text-xs font-mono font-black text-primary-orange bg-primary-orange/10 px-2 py-0.5 rounded border border-primary-orange/15 group-hover:scale-105 transition-transform">
                        {coupon.code}
                      </span>
                      <p className="text-[11px] text-on-surface-variant leading-none">{desc}</p>
                    </div>
                    <span className="text-[10px] text-primary-accent font-bold uppercase">Toque para Copiar</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Generic configuration options */}
        <section className="bg-surface-container-low p-4 rounded-2xl border border-white/5 space-y-1 text-sm font-semibold text-white">
          <div
            onClick={() => onChangeScreen('dashboard')}
            className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-all text-primary-orange group"
          >
            <span className="flex items-center gap-3 font-bold">
              <Database className="w-4 h-4 text-primary-orange" />
              <span className="flex items-center gap-2">
                Painel do Restaurante ({activeRestaurant?.name || 'Administrativo'})
                <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-black uppercase tracking-wider">
                  Restrito
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-primary-orange group-hover:translate-x-0.5 transition-transform" />
          </div>

          {onOpenSuperAdmin && (
            <div
              onClick={onOpenSuperAdmin}
              className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-all text-primary-accent group"
            >
              <span className="flex items-center gap-3 font-bold">
                <Shield className="w-4 h-4 text-primary-accent" />
                <span className="flex items-center gap-2">
                  Super Admin WP Internet (Multi-Tenant)
                  <span className="text-[8px] bg-primary-accent/10 text-primary-accent px-1.5 py-0.5 rounded border border-primary-accent/20 font-black uppercase tracking-wider">
                    WP Integrada
                  </span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-primary-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          <div
            onClick={() => onChangeScreen('favorites')}
            className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-all"
          >
            <span className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-primary-orange" /> Meus Pratos Favoritos
            </span>
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </div>

          <div
            onClick={() => onChangeScreen('orders')}
            className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-all"
          >
            <span className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-primary-orange" /> Acompanhar Histórico de Pedidos
            </span>
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </div>

          <div
            onClick={() => showToast('Políticas de Privacidade atualizadas em 2026!')}
            className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-all"
          >
            <span className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-primary-orange" /> Termos & Privacidade
            </span>
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </div>
        </section>

        {/* Logout action */}
        <div className="pt-4 text-center">
          <button
            onClick={() => showToast('Sessão do Urban Burguer recarregada!')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 text-red-400 text-xs font-bold rounded-xl active:scale-95 transition-transform"
          >
            <LogOut className="w-4 h-4" /> Recarregar Sessão
          </button>
        </div>
      </main>

      {/* Modern state-based Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-surface-container-high border border-primary-orange/30 text-white text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 max-w-xs text-center"
          >
            <span className="w-2 h-2 bg-primary-orange rounded-full animate-ping shrink-0" />
            <span className="font-bold leading-tight">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
