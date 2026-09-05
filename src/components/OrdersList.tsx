import React, { useState } from 'react';
import { Clock, ShieldCheck, Utensils, Compass, ArrowLeft, RefreshCw, Smartphone, RotateCcw, Check, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import { Order, ScreenType, Restaurant } from '../types';
import { useLogo } from '../lib/logoState';

interface OrdersListProps {
  orders: Order[];
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  onReorder?: (order: Order) => void;
  activeRestaurant?: Restaurant | null;
  customerName?: string;
  customerPhone?: string;
}

export default function OrdersList({ orders, onBack, onChangeScreen, onReorder }: OrdersListProps) {
  const logo = useLogo();
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Helper to get status representation
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Preparando':
      case 'EM PREPARO':
        return {
          label: 'Preparando na Brasa',
          styles: 'bg-amber-500/10 text-amber-500 border-amber-500/15',
          icon: <Utensils className="w-4 h-4 text-amber-500 animate-pulse" />,
        };
      case 'A caminho':
      case 'SAIU PARA ENTREGA':
        return {
          label: 'Saiu para Entrega',
          styles: 'bg-sky-500/10 text-sky-500 border-sky-500/15',
          icon: <Compass className="w-4 h-4 text-sky-500 animate-spin" />,
        };
      case 'Entregue':
      case 'FINALIZADO':
        return {
          label: 'Pedido Entregue',
          styles: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        };
      case 'Pendente':
      case 'NOVO':
      case 'CONFIRMADO':
      default:
        return {
          label: 'Confirmado na Cozinha',
          styles: 'bg-primary-orange/10 text-primary-orange border-primary-orange/15',
          icon: <Clock className="w-4 h-4 text-primary-orange animate-pulse" />,
        };
    }
  };

  const handleReorderClick = (order: Order) => {
    if (!onReorder) return;
    setReorderingId(order.id);
    setTimeout(() => {
      onReorder(order);
    }, 280);
  };

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-32">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-dark-bg/95 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-5 justify-between max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-sm">
        <div className="flex items-center">
          <button
            id="orders-back-btn"
            onClick={onBack}
            className="text-primary-orange p-1 hover:bg-white/5 rounded-full outline-none mr-3 transition-transform active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold text-white text-base">Meus Pedidos</h1>
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
            <span className="text-xs font-black tracking-tight text-white leading-none">Urban Burguer</span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Artesanal</span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-surface-container mt-4 p-4 rounded-2xl border border-white/5">
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Histórico de Pedidos</p>
            <p className="text-[10px] text-primary-accent uppercase font-bold tracking-wider">
              {orders.length} {orders.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
            </p>
          </div>
          <button
            id="refresh-orders-btn"
            onClick={() => {
              // Trigger visual refresh
              const prev = reorderingId;
              setReorderingId('refresh');
              setTimeout(() => setReorderingId(prev), 400);
            }}
            className="text-primary-orange hover:bg-white/5 p-2 rounded-xl transition-colors shrink-0"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${reorderingId === 'refresh' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Orders block */}
        <section className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-surface-container rounded-2xl border border-dashed border-white/5 space-y-4">
              <div className="w-16 h-16 bg-surface-container-high/60 rounded-full flex items-center justify-center mx-auto text-primary-orange">
                <Utensils className="w-7 h-7" />
              </div>
              <p className="text-xs font-semibold text-on-surface-variant">Nenhum pedido realizado até o momento.</p>
              <button
                id="empty-order-start-btn"
                onClick={() => onChangeScreen('menu')}
                className="px-6 py-2.5 bg-primary-orange hover:bg-primary-accent text-white text-xs font-bold rounded-xl active:scale-95 shadow-md shadow-primary-orange/20 cursor-pointer"
              >
                Ver Cardápio e Fazer Pedido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
              {[...orders].reverse().map((order) => {
                const statusInfo = getStatusDetails(order.status);
                const isReordering = reorderingId === order.id;

                return (
                  <div
                    key={order.id}
                    id={`order-card-${order.id}`}
                    className="bg-surface-container-low p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4 flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Order Header */}
                      <div className="flex justify-between items-start border-b border-white/5 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Pedido</span>
                            {order.date && (
                              <span className="text-[10px] text-on-surface-variant/80 font-medium">
                                • {order.date}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-white text-sm font-mono tracking-tight">#{order.id}</h4>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.styles}`}>
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </div>
                      </div>

                      {/* Order Items Detailed */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                          Itens do Pedido ({order.items.reduce((sum, item) => sum + item.quantity, 0)})
                        </span>
                        <div className="space-y-2 bg-surface-container/60 p-3 rounded-xl border border-white/5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between text-white font-semibold">
                                <span className="flex items-center gap-2">
                                  <span className="text-primary-orange font-black text-xs">{item.quantity}x</span>
                                  <span>{item.menuItem.name}</span>
                                </span>
                                <span className="text-white/80 text-[11px] font-mono">
                                  R$ {((item.menuItem.price + (item.selectedSides?.reduce((s, side) => s + side.price, 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              {/* Sides / Extras */}
                              {item.selectedSides && item.selectedSides.length > 0 && (
                                <div className="pl-5 space-y-0.5">
                                  {item.selectedSides.map((side, sIdx) => (
                                    <div key={sIdx} className="text-[10.5px] text-primary-accent flex items-center justify-between">
                                      <span>+ {side.name}</span>
                                      {side.price > 0 && (
                                        <span className="font-mono">R$ {side.price.toFixed(2).replace('.', ',')}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Notes */}
                              {item.notes && (
                                <p className="pl-5 text-[10.5px] text-amber-300/80 italic">
                                  Obs: "{item.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery and payment metadata */}
                      <div className="space-y-1 text-[11px] text-on-surface-variant pt-1">
                        {order.address?.street && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                            <span className="truncate">
                              {order.address.street} {order.address.details ? `- ${order.address.details}` : ''} ({order.address.neighborhood || 'Centro'})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-on-surface-variant" /> Previsão: {order.estimatedTime || '25 - 35 min'}
                          </span>
                          {order.paymentMethod && (
                            <span className="flex items-center gap-1 uppercase font-bold text-primary-accent">
                              <CreditCard className="w-3 h-3" /> {order.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer: Total & Action 'Pedir novamente' */}
                    <div className="pt-3 border-t border-white/5 space-y-3 mt-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-on-surface-variant">Total do Pedido</span>
                        <span className="font-black text-base text-primary-orange font-mono">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* 'Pedir novamente' Button */}
                      {onReorder && (
                        <button
                          id={`reorder-btn-${order.id}`}
                          onClick={() => handleReorderClick(order)}
                          disabled={isReordering}
                          className="w-full py-2.5 px-4 bg-primary-orange hover:bg-primary-accent active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-orange/15 cursor-pointer disabled:opacity-80 group"
                        >
                          {isReordering ? (
                            <>
                              <Check className="w-4 h-4 text-white animate-pulse" />
                              <span>Preenchendo carrinho...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-90 text-white" />
                              <span>Pedir novamente</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
