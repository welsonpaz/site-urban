import React, { useState } from 'react';
import { Truck, Clock, Phone, Plus, Trash2, Check, DollarSign, MapPin, QrCode } from 'lucide-react';
import { Restaurant, DeliveryFeeRule, StoreStatusMode } from '../../types';
import { saveRestaurantToDB } from '../../lib/tenantService';

interface DeliverySettingsTabProps {
  restaurant: Restaurant;
  onRestaurantUpdated: (restaurant: Restaurant) => void;
}

export default function DeliverySettingsTab({ restaurant, onRestaurantUpdated }: DeliverySettingsTabProps) {
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp || '');
  const [openingTime, setOpeningTime] = useState(restaurant.openingTime || '18:00');
  const [closingTime, setClosingTime] = useState(restaurant.closingTime || '23:30');
  const [daysText, setDaysText] = useState(restaurant.daysText || 'Terça a Domingo');
  const [statusMode, setStatusMode] = useState<StoreStatusMode>(restaurant.statusMode || 'auto');
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState<number>(restaurant.defaultDeliveryFee || 5.0);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFeeRule[]>(restaurant.deliveryFees || []);

  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newFee, setNewFee] = useState<number>(5.0);

  const [pixKey, setPixKey] = useState(restaurant.paymentMethods?.pixKey || '');
  const [pixEnabled, setPixEnabled] = useState(restaurant.paymentMethods?.pix ?? true);
  const [creditCardEnabled, setCreditCardEnabled] = useState(restaurant.paymentMethods?.creditCard ?? true);
  const [debitCardEnabled, setDebitCardEnabled] = useState(restaurant.paymentMethods?.debitCard ?? true);
  const [cashEnabled, setCashEnabled] = useState(restaurant.paymentMethods?.cash ?? true);

  const [saving, setSaving] = useState(false);

  const handleAddNeighborhoodFee = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newNeighborhood.trim();
    if (!clean) return;

    if (deliveryFees.some(d => d.neighborhood.toLowerCase() === clean.toLowerCase())) {
      alert('Essa taxa de bairro já está cadastrada! Você pode editá-la removendo e adicionando novamente.');
      return;
    }

    const updated = [...deliveryFees, { neighborhood: clean, fee: Number(newFee) }];
    setDeliveryFees(updated);
    setNewNeighborhood('');
    setNewFee(5.0);
  };

  const handleRemoveNeighborhoodFee = (idx: number) => {
    setDeliveryFees(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: Restaurant = {
        ...restaurant,
        whatsapp: whatsapp.replace(/\D/g, ''),
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        daysText: daysText.trim(),
        statusMode,
        defaultDeliveryFee: Number(defaultDeliveryFee),
        deliveryFees,
        paymentMethods: {
          pix: pixEnabled,
          creditCard: creditCardEnabled,
          debitCard: debitCardEnabled,
          cash: cashEnabled,
          pixKey: pixKey.trim()
        },
        updatedAt: new Date().toISOString()
      };

      await saveRestaurantToDB(updated);
      onRestaurantUpdated(updated);
      alert('Configurações de entrega, horário e pagamentos salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Header */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary-orange" />
            Taxas de Entrega, Horários e Pagamentos • {restaurant.name}
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            Configure as taxas cobradas no checkout por bairro, horário de funcionamento e WhatsApp.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all w-full sm:w-auto justify-center"
        >
          <Check className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* WhatsApp & Operating Hours */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4 shadow-md">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-orange" />
          Horário de Atendimento e WhatsApp de Pedidos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              WhatsApp para Envio Automático dos Pedidos *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-orange" />
              <input
                type="text"
                required
                placeholder="5586998030143"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-on-surface-variant/60">
              Número internacional sem espaços ou hífens (ex: 5586998030143).
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Modo de Operação da Loja
            </label>
            <select
              value={statusMode}
              onChange={e => setStatusMode(e.target.value as StoreStatusMode)}
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none font-bold"
            >
              <option value="auto">Automático (Calcula com base no relógio e dias)</option>
              <option value="open">Aberto Agora (Forçar aberto para pedidos)</option>
              <option value="closed">Fechado Agora (Pausar recebimento no momento)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Dias de Funcionamento (Texto do Cardápio)
            </label>
            <input
              type="text"
              placeholder="Terça a Domingo"
              value={daysText}
              onChange={e => setDaysText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                Horário Abertura
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={e => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                Horário Fechamento
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={e => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Fees per Neighborhood */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-orange" />
            Tabela de Taxas de Entrega por Bairro
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-on-surface-variant font-medium">Taxa Padrão:</span>
            <input
              type="number"
              step="0.50"
              value={defaultDeliveryFee}
              onChange={e => setDefaultDeliveryFee(parseFloat(e.target.value) || 0)}
              className="w-20 px-2.5 py-1 bg-surface-container-lowest border border-white/10 rounded-lg text-xs font-bold text-white text-center"
            />
          </div>
        </div>

        {/* Add neighborhood fee form */}
        <div className="p-3 bg-surface-container-lowest rounded-xl border border-white/5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Nome do Bairro (ex: Centro, Jardins, Fátima)..."
            value={newNeighborhood}
            onChange={e => setNewNeighborhood(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-container border border-white/10 rounded-xl text-xs text-white placeholder-on-surface-variant/40 focus:border-primary-orange focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-bold">R$</span>
            <input
              type="number"
              step="0.50"
              min="0"
              placeholder="6.00"
              value={newFee}
              onChange={e => setNewFee(parseFloat(e.target.value) || 0)}
              className="w-24 px-3 py-2 bg-surface-container border border-white/10 rounded-xl text-xs text-white text-center font-bold"
            />
            <button
              type="button"
              onClick={handleAddNeighborhoodFee}
              className="px-3.5 py-2 bg-primary-orange hover:opacity-90 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Adicionar Bairro
            </button>
          </div>
        </div>

        {/* List of configured delivery fees */}
        <div className="space-y-1.5 pt-1">
          {deliveryFees.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-4">
              Nenhum bairro com taxa fixa cadastrado. A taxa padrão (R$ {defaultDeliveryFee.toFixed(2)}) será utilizada.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deliveryFees.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                    <span className="text-xs font-bold text-white">{rule.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      R$ {rule.fee.toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNeighborhoodFee(idx)}
                      className="p-1.5 hover:bg-red-500/15 text-on-surface-variant hover:text-red-400 rounded-lg transition-colors"
                      title="Remover"
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

      {/* Payment Methods */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4 shadow-md">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary-orange" />
          Formas de Pagamento Aceitas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-xl border border-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={pixEnabled}
              onChange={e => setPixEnabled(e.target.checked)}
              className="accent-primary-orange w-4 h-4 rounded"
            />
            <span className="text-xs font-bold text-white">Chave Pix</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-xl border border-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={creditCardEnabled}
              onChange={e => setCreditCardEnabled(e.target.checked)}
              className="accent-primary-orange w-4 h-4 rounded"
            />
            <span className="text-xs font-bold text-white">Cartão de Crédito</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-xl border border-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={debitCardEnabled}
              onChange={e => setDebitCardEnabled(e.target.checked)}
              className="accent-primary-orange w-4 h-4 rounded"
            />
            <span className="text-xs font-bold text-white">Cartão de Débito</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-xl border border-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={cashEnabled}
              onChange={e => setCashEnabled(e.target.checked)}
              className="accent-primary-orange w-4 h-4 rounded"
            />
            <span className="text-xs font-bold text-white">Dinheiro com Troco</span>
          </label>
        </div>

        {pixEnabled && (
          <div className="pt-2">
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              Chave Pix do Restaurante (Telefone, CNPJ, CPF ou Aleatória)
            </label>
            <input
              type="text"
              placeholder="Ex: 86998030143 ou financeiro@seurestaurante.com"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
            />
          </div>
        )}
      </div>
    </form>
  );
}
