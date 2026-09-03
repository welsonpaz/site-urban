import React from 'react';
import { Clock, ShieldCheck, HelpCircle, Utensils, Compass, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { Order, ScreenType } from '../types';
import { useLogo } from '../lib/logoState';

interface OrdersListProps {
  orders: Order[];
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
}

export default function OrdersList({ orders, onBack, onChangeScreen }: OrdersListProps) {
  const logo = useLogo();
  // Helper to get status representation
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Preparando':
        return {
          label: 'Preparando na Brasa',
          styles: 'bg-amber-500/10 text-amber-500 border-amber-500/15',
          icon: <Utensils className="w-4 h-4 text-amber-500 animate-pulse" />,
        };
      case 'A caminho':
        return {
          label: 'Saiu para Entrega',
          styles: 'bg-sky-500/10 text-sky-500 border-sky-500/15',
          icon: <Compass className="w-4 h-4 text-sky-500 animate-spin" />,
        };
      case 'Entregue':
        return {
          label: 'Pedido Entregue',
          styles: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        };
      case 'Pendente':
      default:
        return {
          label: 'Aguardando Cozinha',
          styles: 'bg-primary-orange/10 text-primary-orange border-primary-orange/15',
          icon: <Clock className="w-4 h-4 text-primary-orange animate-pulse" />,
        };
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
            <p className="text-xs text-on-surface-variant font-medium">Sua conta: WelsonPaz@gmail.com</p>
            <p className="text-[10px] text-primary-accent uppercase font-bold tracking-wider">Histórico Atualizado</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-orange hover:bg-white/5 p-2 rounded-xl transition-colors shrink-0"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
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
                onClick={() => onChangeScreen('menu')}
                className="px-6 py-2.5 bg-primary-orange text-white text-xs font-bold rounded-xl active:scale-95"
              >
                Começar a Adicionar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
              {[...orders].reverse().map((order) => {
                const statusInfo = getStatusDetails(order.status);
                const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ');

                return (
                  <div
                    key={order.id}
                    className="bg-surface-container-low p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant">Numero do Pedido</span>
                        <h4 className="font-extrabold text-white text-sm font-mono tracking-tight">#{order.id}</h4>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.styles}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Order summary products */}
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-orange/5 p-2.5 rounded-xl text-primary-orange">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">{itemsSummary}</p>
                        {order.items.some((i) => i.notes) && (
                          <div className="text-[10px] text-amber-300/90 space-y-0.5">
                            {order.items
                              .filter((i) => i.notes)
                              .map((i, idx) => (
                                <p key={idx} className="italic truncate">
                                  • {i.menuItem.name}: "{i.notes}"
                                </p>
                              ))}
                          </div>
                        )}
                        <p className="text-[10px] text-on-surface-variant leading-none">Previsão: {order.estimatedTime}</p>
                        <p className="text-[10px] text-on-surface-variant italic">Endereço: {order.address.street}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2 text-xs font-semibold">
                      <span className="text-on-surface-variant">Total Pago</span>
                      <span className="font-black text-sm text-primary-orange">R$ {order.total.toFixed(2).replace('.', ',')}</span>
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
