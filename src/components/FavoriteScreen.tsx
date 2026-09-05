import React from 'react';
import { ArrowLeft, Heart, Star, ShoppingBag, Terminal } from 'lucide-react';
import { MenuItem, ScreenType, Restaurant } from '../types';
import { useLogo, useBranding } from '../lib/logoState';

interface FavoriteScreenProps {
  menuItems: MenuItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectProduct: (product: MenuItem) => void;
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  activeRestaurant?: Restaurant | null;
}

export default function FavoriteScreen({
  menuItems,
  favorites,
  toggleFavorite,
  onSelectProduct,
  onBack,
  onChangeScreen,
}: FavoriteScreenProps) {
  const logo = useLogo();
  const branding = useBranding();
  // Filter favorite options
  const likedItems = menuItems.filter((item) => favorites.includes(item.id));

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
          <h1 className="font-extrabold text-white text-base">Meus Favoritos</h1>
        </div>
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChangeScreen('menu')}>
          <div className="relative p-0.5 bg-gradient-to-tr from-primary-orange to-primary-accent rounded-full shrink-0 shadow-md shadow-primary-orange/10">
            <img
              alt="Logo"
              className="h-9 w-9 object-cover rounded-full bg-black border border-white/10 aspect-square"
              src={logo}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-tight text-white leading-none">{branding.name}</span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Artesanal</span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        <div className="bg-surface-container mt-4 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <span className="bg-primary-orange/10 p-2.5 rounded-xl text-primary-orange">
            <Heart className="w-5 h-5 fill-primary-orange" />
          </span>
          <div>
            <h3 className="font-bold text-xs text-white">Lista Selecionada</h3>
            <p className="text-[10px] text-on-surface-variant font-medium">Toque nos pratos para abrir o menu e personalizar ingredientes</p>
          </div>
        </div>

        {/* Favorite Grid */}
        <section className="space-y-4">
          {likedItems.length === 0 ? (
            <div className="text-center py-16 bg-surface-container rounded-2xl border border-dashed border-white/5 space-y-4">
              <div className="w-16 h-16 bg-surface-container-high/60 rounded-full flex items-center justify-center mx-auto text-primary-orange">
                <Heart className="w-7 h-7" />
              </div>
              <p className="text-xs font-semibold text-on-surface-variant">Você ainda não favoritou nenhum prato.</p>
              <button
                onClick={() => onChangeScreen('menu')}
                className="px-6 py-2.5 bg-primary-orange text-white text-xs font-bold rounded-xl active:scale-95 animate-pulse"
              >
                Escolher Prato
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {likedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="flex gap-4 p-3 bg-surface-container-lowest/80 rounded-2xl border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <div className="relative w-24 h-24 flex-none overflow-hidden rounded-xl bg-surface-container bg-opacity-40">
                    <img
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      src={item.imageUrl}
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-grow">
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-sm text-white group-hover:text-primary-orange transition-colors duration-150">
                          {item.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className="text-primary-orange bg-primary-orange/5 p-1.5 rounded-xl hover:bg-primary-orange/15 active:scale-90"
                          title="Desfavoritar"
                        >
                          <Heart className="w-4 h-4 fill-primary-orange" />
                        </button>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-primary-orange">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-white">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
