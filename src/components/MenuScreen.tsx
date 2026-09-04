import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, Search, ShoppingBag, Plus, Star, Heart, ReceiptText, User, Flame, X, Clock } from 'lucide-react';
import { MenuItem, CartItem, ScreenType, Restaurant } from '../types';
import { useLogo, useBranding, isStoreOpen } from '../lib/logoState';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

interface MenuScreenProps {
  menuItems: MenuItem[];
  cartItems: CartItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectProduct: (product: MenuItem) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onChangeScreen: (screen: ScreenType) => void;
  onAddToCartDirect: (product: MenuItem) => void;
  activeRestaurant?: Restaurant | null;
  allRestaurants?: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export default function MenuScreen({
  menuItems,
  cartItems,
  favorites,
  toggleFavorite,
  onSelectProduct,
  activeCategory,
  setActiveCategory,
  onChangeScreen,
  onAddToCartDirect,
  activeRestaurant,
  allRestaurants,
  onSelectRestaurant,
}: MenuScreenProps) {
  const defaultLogo = useLogo();
  const defaultBranding = useBranding();

  const logo = activeRestaurant?.logoUrl || defaultLogo;
  const branding = activeRestaurant ? {
    name: activeRestaurant.name,
    subtitle: activeRestaurant.subtitle || 'Cardápio Digital Oficial',
    tag: activeRestaurant.tag || 'QUALIDADE • AGILIDADE',
    logoUrl: activeRestaurant.logoUrl,
    openingTime: activeRestaurant.openingTime,
    closingTime: activeRestaurant.closingTime,
    daysText: activeRestaurant.daysText,
    statusMode: activeRestaurant.statusMode,
    openDays: activeRestaurant.openDays
  } : defaultBranding;

  const storeStatus = isStoreOpen(branding);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'pedidos' | 'favoritos' | 'perfil'>('menu');
  const [searchCategory, setSearchCategory] = useState<string>('Todos');

  // Dynamic Categories list based on restaurant
  const categories = (activeRestaurant?.categories && activeRestaurant.categories.length > 0)
    ? activeRestaurant.categories
    : ['Hambúrgueres', 'Combos', 'Batatas Recheadas', 'Porções', 'Bebidas'];

  // Calculate cart count & total
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, curr) => acc + curr.menuItem.price * curr.quantity + (curr.selectedSides?.reduce((s, d) => s + d.price, 0) || 0) * curr.quantity,
    0
  );

  // Filter items
  const filteredProducts = menuItems.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return item.category === activeCategory;
    }

    // Search query matches name, description, category, or any ingredient
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.ingredients && item.ingredients.some((ing) => ing.name.toLowerCase().includes(query)));

    if (!matchesSearch) return false;

    // Apply category filter inside search results
    if (searchCategory !== 'Todos') {
      return item.category === searchCategory;
    }
    return true;
  });

  // Hot/Popular items ("Mais Pedidos")
  const popularProducts = menuItems.filter((item) => item.isPopular);

  // Helper to highlight matching text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary-orange/25 text-white font-extrabold rounded-md px-0.5 select-none decoration-clone">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-32">
      {/* Main Container */}
      <main className="pt-4 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4">
        {/* Brand Hero Banner */}
        <div className="bg-gradient-to-b from-surface-container-high via-surface-container/90 to-surface-container-lowest p-6 rounded-3xl border border-white/10 relative text-center flex flex-col items-center justify-center shadow-2xl shadow-primary-orange/5">
          {/* Glowing backdrops */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-orange/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute right-[-40px] bottom-[-40px] w-40 h-40 bg-primary-accent/10 rounded-full blur-[50px] pointer-events-none" />
          
          {/* Menu button in top-left corner */}
          <button 
            onClick={() => onChangeScreen('profile')}
            className="md:hidden absolute top-6 left-6 active:scale-95 transition-transform text-white p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl shadow-lg flex items-center justify-center hover:shadow-primary-orange/10 z-20"
            title="Abrir Perfil"
          >
            <MenuIcon className="w-5.5 h-5.5 text-primary-orange" />
          </button>

          {/* Sacola/Carrinho button in top-right corner */}
          <button 
            onClick={() => onChangeScreen('cart')}
            className="md:hidden absolute top-6 right-6 active:scale-95 transition-transform text-white p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl shadow-lg flex items-center justify-center hover:shadow-primary-orange/10 z-20"
            title="Ver Carrinho"
          >
            <ShoppingBag className="w-5.5 h-5.5 text-primary-orange" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary-orange text-white text-[10px] h-5 min-w-5 flex items-center justify-center font-black rounded-full px-1 shadow-md border border-black animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10 w-full max-w-3xl pt-20 sm:pt-6 text-center sm:text-left">
            {/* Left side: Logo + Slogan (vertically centered) */}
            <div className="flex flex-col items-center justify-center shrink-0 space-y-2">
              {/* Huge Logo from image (displayed exactly as it is, no gradient wrapper, no clipping) */}
              <div className="relative shrink-0 active:scale-105 transition-transform duration-300">
                <img
                  alt="Logo Grande Urban Burguer"
                  className="h-28 w-28 sm:h-44 sm:w-44 md:h-52 md:w-52 object-cover rounded-2xl border border-white/10 shadow-2xl relative z-10 aspect-square bg-black"
                  src={logo}
                />
              </div>
              
              {/* Slogan Badge */}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-primary-orange/20 text-primary-orange uppercase tracking-widest border border-primary-orange/25 text-center">
                <Flame className="w-3.5 h-3.5 text-primary-accent animate-pulse shrink-0" /> {branding.tag}
              </span>
            </div>
            
            {/* Divider line for layout separation */}
            <div className="h-px w-24 sm:h-32 sm:w-px bg-white/10 shrink-0" />

            {/* Right side: Burger Joint Name and description (vertically centered) */}
            <div className="flex flex-col justify-center items-center sm:items-start space-y-2 sm:space-y-3 max-w-full sm:max-w-md">
              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-primary-orange uppercase drop-shadow-md leading-none">
                {branding.name}
              </h1>
              <p className="text-xs sm:text-xs md:text-sm text-on-surface-variant font-medium leading-relaxed max-w-[280px] sm:max-w-none">
                {branding.subtitle}
              </p>

              {/* Opening Hours & Open/Closed Badge */}
              <div className="pt-1">
                {storeStatus.isOpen ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shadow-sm backdrop-blur-sm">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-extrabold">{storeStatus.reason}</span>
                    <span className="text-[10.5px] opacity-80 border-l border-emerald-500/30 pl-2 ml-0.5">
                      {storeStatus.detail}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold shadow-sm backdrop-blur-sm">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="font-extrabold">{storeStatus.reason}</span>
                    <span className="text-[10.5px] opacity-80 border-l border-rose-500/30 pl-2 ml-0.5">
                      {storeStatus.detail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Section */}
        <section className="mt-2 text-left">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/70">
              <Search className="w-5 h-5 text-outline" />
            </div>
            <input
              id="main-search-input"
              className="w-full h-12 pl-12 pr-12 rounded-xl bg-surface-container border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/20 text-on-surface font-medium placeholder:text-outline/40 transition-all outline-none"
              placeholder="O que você quer comer hoje?"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchCategory('Todos'); // Reset the search category back to "Todos" for broad matching on keystrokes
              }}
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategory('Todos');
                }}
                className="absolute inset-y-0 right-4 flex items-center text-primary-orange hover:text-white transition-colors p-1"
                title="Limpar busca"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* Category Horizontal Scroll */}
        <section className="overflow-hidden -mx-5 px-5">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:justify-center">
            {searchQuery.trim() !== '' ? (
              // When searching, we display searchCategory including "Todos" option
              ['Todos', ...categories].map((cat) => {
                const isActive = searchCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSearchCategory(cat)}
                    className={`flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/20'
                        : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container-high hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })
            ) : (
              // Standard behavior if query has no characters
              categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/20'
                        : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container-high hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Mais Pedidos section removed to focus on hamburger categories */}

        {/* Selected Category or Search Results Section */}
        <section className="pb-8">
          <div className="flex justify-between items-center mb-4 mt-6">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-6 rounded-full ${searchQuery.trim() ? 'bg-primary-orange' : 'bg-primary-accent'}`} />
              <h2 className="font-extrabold text-lg text-white tracking-tight text-left">
                {searchQuery.trim() ? `Resultado para "${searchQuery}"` : activeCategory}
              </h2>
            </div>
            {searchQuery.trim() && (
              <span className="text-[10px] uppercase font-bold text-primary-orange bg-primary-orange/10 px-2.5 py-1 rounded-full border border-primary-orange/15">
                {filteredProducts.length} prato{filteredProducts.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-surface-container rounded-2xl border border-dashed border-white/10 space-y-4 px-4 my-4">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto text-primary-orange">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Nenhum prato encontrado</p>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Não encontramos correspondência para sua busca. Experimente buscar ingredientes como "Angus" ou "Cheddar", ou selecione uma opção abaixo:
                </p>
              </div>
              
              {/* Sugestões de busca */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {['Angus', 'Margherita', 'Chocolate', 'Limonada', 'Salmão', 'Cheddar'].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => {
                      setSearchQuery(sug);
                      setSearchCategory('Todos');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary-orange/10 hover:bg-primary-orange/20 border border-primary-orange/15 text-primary-orange text-xs font-bold transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : activeCategory === 'Hambúrgueres' && !searchQuery.trim() ? (
            <div className="space-y-8">
              {/* Destaque O Chefão */}
              {(() => {
                const chefao = menuItems.find((item) => item.id === 'o-chefao');
                if (!chefao) return null;
                return (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-orange/20 to-primary-accent/5 border-2 border-primary-orange/40 shadow-xl shadow-primary-orange/10 p-5 mt-2 flex flex-col gap-4 text-left group">
                    {/* Glowing Accent badges in standard flow (prevent covering image/text) */}
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-primary-orange text-white uppercase tracking-wider animate-pulse shadow-md shadow-primary-orange/30">
                        <Flame className="w-3 h-3 fill-white" /> O Mais Vendido
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-white/10 text-white backdrop-blur-md uppercase tracking-wider">
                        ★ {chefao.rating} Destaque
                      </span>
                    </div>

                    {/* Main content flex layout */}
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Image Container */}
                      <div className="relative w-full sm:w-44 h-40 sm:h-36 rounded-2xl overflow-hidden bg-surface-container shrink-0 cursor-pointer" onClick={() => onSelectProduct(chefao)}>
                        <img
                          alt={chefao.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          src={chefao.imageUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <span className="text-xl font-black text-white block leading-none">
                            {chefao.name}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="flex flex-col justify-between flex-grow space-y-3 sm:space-y-0 text-left">
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-white group-hover:text-primary-orange transition-colors duration-150 cursor-pointer" onClick={() => onSelectProduct(chefao)}>
                            {chefao.name} — O Favorito da Casa!
                          </h4>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                            {chefao.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 sm:pt-0">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Preço Especial</span>
                            <span className="font-black text-2xl text-primary-orange">
                              R$ {chefao.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onSelectProduct(chefao)}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all"
                            >
                              Ver Prato
                            </button>
                            <button
                              onClick={() => onAddToCartDirect(chefao)}
                              className="px-4 py-2 rounded-xl bg-primary-orange text-white font-bold text-xs hover:bg-opacity-95 active:scale-95 transition-all shadow-lg shadow-primary-orange/20"
                            >
                              Quero Esse!
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {(['Especiais', 'Clássicos', 'Tradicionais'] as const).map((type) => {
                const burgersOfType = filteredProducts.filter((item) => item.burgerType === type);
                if (burgersOfType.length === 0) return null;

                const displayTitle = type === 'Especiais'
                  ? '⭐ Especiais'
                  : type === 'Clássicos'
                    ? '🍔 Clássicos'
                    : '🍔 Tradicionais';

                return (
                  <div key={type} className="space-y-4">
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-1.5 h-4.5 bg-primary-orange rounded-full" />
                      <h3 className="text-sm font-black uppercase text-white tracking-wider">
                        {displayTitle}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {burgersOfType.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-3 bg-surface-container-lowest/80 rounded-2xl border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all cursor-pointer group text-left"
                          onClick={() => onSelectProduct(item)}
                        >
                          <div className="relative w-28 h-28 flex-none overflow-hidden rounded-xl bg-surface-container">
                            <img
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                              src={item.imageUrl}
                            />
                          </div>

                          <div className="flex flex-col justify-between flex-grow">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <h3 className="font-bold text-base text-white group-hover:text-primary-orange transition-colors duration-150 text-left">
                                  {item.name}
                                </h3>
                                {item.rating && (
                                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-xs font-bold text-on-surface">{item.rating}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant leading-tight line-clamp-2 text-left">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                              <span className="font-extrabold text-base text-primary-orange">
                                R$ {item.price.toFixed(2).replace('.', ',')}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCartDirect(item);
                                }}
                                className="w-9 h-9 rounded-xl bg-primary-orange text-white flex items-center justify-center hover:bg-opacity-90 active:scale-90 transition-all shadow-md shadow-primary-orange/15"
                                title="Adicionar ao carrinho"
                              >
                                <Plus className="w-5 h-5 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-surface-container-lowest/80 rounded-2xl border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all cursor-pointer group text-left"
                  onClick={() => onSelectProduct(item)}
                >
                  <div className="relative w-28 h-28 flex-none overflow-hidden rounded-xl bg-surface-container">
                    <img
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      src={item.imageUrl}
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-grow">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-bold text-base text-white group-hover:text-primary-orange transition-colors duration-150 text-left">
                          {highlightText(item.name, searchQuery)}
                        </h3>
                        {item.rating && (
                          <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-on-surface">{item.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Description with highlighting */}
                      <p className="text-xs text-on-surface-variant leading-tight line-clamp-2 text-left">
                        {highlightText(item.description, searchQuery)}
                      </p>

                      {/* Display matched ingredients as visual pills inside search results if they match! */}
                      {searchQuery.trim() && item.ingredients && item.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase())) && (
                        <div className="flex flex-wrap gap-1 pt-1.5 justify-start">
                          {item.ingredients
                            .filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((ing, idx) => (
                              <span key={idx} className="text-[10px] bg-primary-accent/15 text-primary-accent border border-primary-accent/10 rounded px-1.5 py-0.5 font-semibold">
                                Contém: {highlightText(ing.name, searchQuery)}
                              </span>
                            ))
                          }
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="font-extrabold text-base text-primary-orange">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCartDirect(item);
                        }}
                        className="w-9 h-9 rounded-xl bg-primary-orange text-white flex items-center justify-center hover:bg-opacity-90 active:scale-90 transition-all shadow-md shadow-primary-orange/15"
                        title="Adicionar ao carrinho"
                      >
                        <Plus className="w-5 h-5 pointer-events-none" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed bottom-24 left-5 right-5 z-40 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto"
          >
            <button
              onClick={() => onChangeScreen('cart')}
              className="w-full bg-primary-orange text-white h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-primary-orange/20 active:scale-95 hover:bg-opacity-95 transition-all outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-sm text-white">{cartCount}</span>
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">Ver Carrinho</span>
              </div>
              <span className="font-extrabold text-base">
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
