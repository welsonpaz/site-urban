import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, Check, XCircle, 
  Search, RefreshCw, User, Phone, MapPin, DollarSign, AlertCircle, Eye
} from 'lucide-react';
import { Order, OrderStatus, Restaurant } from '../../types';
import { getOrdersByRestaurant, updateOrderStatusInDB } from '../../lib/tenantService';

interface OrdersManagerTabProps {
  restaurant: Restaurant;
}

export default function OrdersManagerTab({ restaurant }: OrdersManagerTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrdersByRestaurant(restaurant.id);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Poll every 15 seconds for new orders
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [restaurant.id]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusInDB(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do pedido.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NOVO':
      case 'Pendente':
        return {
          label: 'Novo Pedido',
          styles: 'bg-primary-orange/20 text-primary-orange border-primary-orange/30 animate-pulse',
        };
      case 'CONFIRMADO':
        return {
          label: 'Confirmado',
          styles: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
        };
      case 'EM PREPARO':
      case 'Preparando':
        return {
          label: 'Em Preparo',
          styles: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        };
      case 'SAIU PARA ENTREGA':
      case 'A caminho':
        return {
          label: 'Saiu p/ Entrega',
          styles: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
        };
      case 'PRONTO PARA RETIRADA':
        return {
          label: 'Pronto p/ Retirada',
          styles: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        };
      case 'FINALIZADO':
      case 'Entregue':
        return {
          label: 'Finalizado',
          styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'CANCELADO':
        return {
          label: 'Cancelado',
          styles: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
      default:
        return {
          label: status,
          styles: 'bg-surface-container-high text-on-surface-variant border-white/5',
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !search.trim() || 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(search)) ||
      (order.address?.neighborhood && order.address.neighborhood.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'NOVOS') return order.status === 'NOVO' || order.status === 'Pendente';
    if (statusFilter === 'PREPARO') return order.status === 'EM PREPARO' || order.status === 'Preparando';
    if (statusFilter === 'ENTREGA') return order.status === 'SAIU PARA ENTREGA' || order.status === 'A caminho' || order.status === 'PRONTO PARA RETIRADA';
    if (statusFilter === 'FINALIZADOS') return order.status === 'FINALIZADO' || order.status === 'Entregue';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Metrics */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary-orange" />
            Gestão de Pedidos em Tempo Real • {restaurant.name}
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            Acompanhe pedidos recebidos e atualize o status para manter o cliente informado.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadOrders}
            className="p-2 bg-surface-container hover:bg-white/5 rounded-xl border border-white/5 text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-orange' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap p-1 bg-surface-container-low rounded-xl border border-white/5 text-xs font-bold">
          {['TODOS', 'NOVOS', 'PREPARO', 'ENTREGA', 'FINALIZADOS'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-primary-orange text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente ou bairro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-white/5 rounded-xl text-xs text-white placeholder-on-surface-variant/40 focus:border-primary-orange focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-white/5 space-y-3">
          <ShoppingBag className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
          <p className="text-xs font-semibold text-on-surface-variant">
            Nenhum pedido encontrado com os filtros selecionados.
          </p>
          <span className="text-[10px] text-on-surface-variant/60 block">
            Novos pedidos feitos pelo cardápio aparecerão aqui instantaneamente!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const badge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                className="bg-surface-container-low p-4 rounded-2xl border border-white/5 shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Header line */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div>
                      <span className="text-xs font-black text-white font-mono">{order.id}</span>
                      <span className="text-[10px] text-on-surface-variant ml-2">
                        {order.date || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${badge.styles}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Customer and Delivery info */}
                  <div className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary-orange" />
                        {order.customerName || 'Cliente sem nome'}
                      </span>
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </a>
                      )}
                    </div>

                    {order.address?.street && (
                      <div className="text-on-surface-variant text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-orange shrink-0" />
                        <span className="truncate">
                          {order.address.street} {order.address.details ? `(${order.address.details})` : ''} - {order.address.neighborhood}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order items brief */}
                  <div className="mt-3 p-2.5 bg-surface-container-lowest rounded-xl border border-white/5 space-y-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-on-surface">
                        <span className="font-semibold text-white">
                          {item.quantity}x {item.menuItem?.name || 'Item'}
                          {item.notes ? <span className="text-amber-400 text-[10px] block">Obs: {item.notes}</span> : null}
                        </span>
                        <span className="text-on-surface-variant font-mono">
                          R$ {((item.menuItem?.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 mt-1 border-t border-white/5 flex justify-between text-xs font-black text-white">
                      <span>Total do Pedido:</span>
                      <span className="text-primary-orange font-mono">
                        R$ {order.total?.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap gap-1.5 justify-end">
                  {order.status !== 'EM PREPARO' && order.status !== 'FINALIZADO' && order.status !== 'CANCELADO' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'EM PREPARO')}
                      disabled={updatingId === order.id}
                      className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                    >
                      Em Preparo
                    </button>
                  )}

                  {order.status !== 'SAIU PARA ENTREGA' && order.status !== 'FINALIZADO' && order.status !== 'CANCELADO' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'SAIU PARA ENTREGA')}
                      disabled={updatingId === order.id}
                      className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Truck className="w-3 h-3" /> Saiu p/ Entrega
                    </button>
                  )}

                  {order.status !== 'FINALIZADO' && order.status !== 'CANCELADO' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'FINALIZADO')}
                      disabled={updatingId === order.id}
                      className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Finalizar
                    </button>
                  )}

                  {order.status !== 'CANCELADO' && order.status !== 'FINALIZADO' && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja cancelar o pedido #${order.id}?`)) {
                          handleUpdateStatus(order.id, 'CANCELADO');
                        }
                      }}
                      disabled={updatingId === order.id}
                      className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-bold active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
