import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, CreditCard, Coins, CheckCircle, ChevronRight, Clock, ShieldCheck, Sparkles, AlertCircle, Copy, Check, MessageSquare, Send } from 'lucide-react';
import { CartItem, ScreenType, Order, UserAddress, Restaurant } from '../types';
import { useLogo, useBranding, isStoreOpen } from '../lib/logoState';
import { MOCK_MAP_IMAGE_URL } from '../data';
import { useCoupons } from '../lib/couponState';
import { saveOrderToDB } from '../lib/tenantService';

interface CheckoutScreenProps {
  cartItems: CartItem[];
  couponCode: string;
  customerName: string;
  customerPhone: string;
  address: UserAddress;
  setAddress: React.Dispatch<React.SetStateAction<UserAddress>>;
  deliveryFee: number;
  onClearCart: () => void;
  onBack: () => void;
  onAddOrder: (order: Order) => void;
  onChangeScreen: (screen: ScreenType) => void;
  activeRestaurant?: Restaurant | null;
}

export default function CheckoutScreen({
  cartItems,
  couponCode,
  customerName,
  customerPhone,
  address,
  setAddress,
  deliveryFee,
  onClearCart,
  onBack,
  onAddOrder,
  onChangeScreen,
  activeRestaurant,
}: CheckoutScreenProps) {
  const defaultLogo = useLogo();
  const defaultBranding = useBranding();

  const logo = activeRestaurant?.logoUrl || defaultLogo;
  const branding = activeRestaurant ? {
    name: activeRestaurant.name,
    subtitle: activeRestaurant.subtitle || '',
    tag: activeRestaurant.tag || '',
    logoUrl: activeRestaurant.logoUrl,
    openingTime: activeRestaurant.openingTime,
    closingTime: activeRestaurant.closingTime,
    daysText: activeRestaurant.daysText,
    statusMode: activeRestaurant.statusMode,
    openDays: activeRestaurant.openDays
  } : defaultBranding;

  const storeStatus = isStoreOpen(branding);
  const { coupons } = useCoupons();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix' | 'cash'>('credit');
  const [needChange, setNeedChange] = useState<boolean>(false);
  const [changeFor, setChangeFor] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState<Order | null>(null);

  // Dynamic Neighborhood delivery fee
  const activeDeliveryFee = useMemo(() => {
    if (activeRestaurant?.deliveryFees && activeRestaurant.deliveryFees.length > 0) {
      const match = activeRestaurant.deliveryFees.find(
        df => df.neighborhood.toLowerCase().trim() === address.neighborhood.toLowerCase().trim()
      );
      if (match) return match.fee;
      if (activeRestaurant.defaultDeliveryFee !== undefined) return activeRestaurant.defaultDeliveryFee;
    }
    return deliveryFee;
  }, [activeRestaurant, address.neighborhood, deliveryFee]);

  // WhatsApp delivery tracking state
  const [sentToStore, setSentToStore] = useState(false);
  const [sentToClient, setSentToClient] = useState(false);

  // Helper to normalize phone numbers for WhatsApp API (Brazilian country code 55)
  const cleanPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '5586998030143';
    if (digits.startsWith('55') && digits.length >= 12) {
      return digits;
    }
    return `55${digits}`;
  };

  // Generate beautiful receipt text for WhatsApp
  const generateOrderMessage = (order: Order, name: string, phone: string) => {
    const restName = activeRestaurant?.name?.toUpperCase() || 'CARDÁPIO DIGITAL';
    let msg = `🍽️ *NOVO PEDIDO - ${restName}* 🍽️\n`;
    msg += `==================================\n\n`;
    msg += `*Código do Pedido:* #${order.id}\n`;
    msg += `*Cliente:* ${name}\n`;
    msg += `*Telefone:* ${phone}\n\n`;
    
    msg += `📋 *ITENS DO PEDIDO:*\n`;
    order.items.forEach((item) => {
      const sidesSum = item.selectedSides?.reduce((s, d) => s + d.price, 0) || 0;
      const unitTotal = item.menuItem.price + sidesSum;
      msg += `• *${item.quantity}x ${item.menuItem.name}* (R$ ${item.menuItem.price.toFixed(2).replace('.', ',')}/un)\n`;
      if (item.selectedSides && item.selectedSides.length > 0) {
        msg += `   _Adicionais:_\n`;
        item.selectedSides.forEach((side) => {
          msg += `   + ${side.name} (+ R$ ${side.price.toFixed(2).replace('.', ',')})\n`;
        });
      }
      if (item.notes) {
        msg += `   _Obs: ${item.notes}_\n`;
      }
      msg += `   *Subtotal item:* R$ ${(unitTotal * item.quantity).toFixed(2).replace('.', ',')}\n\n`;
    });
    
    msg += `==================================\n\n`;
    msg += `📍 *ENDEREÇO DE ENTREGA:*\n`;
    msg += `*Rua/Nº:* ${order.address.street}\n`;
    if (order.address.details) {
      msg += `*Complemento:* ${order.address.details}\n`;
    }
    msg += `*Bairro:* ${order.address.neighborhood}\n`;
    msg += `*Cidade/UF:* ${order.address.cityState || 'Teresina - PI'}\n\n`;
    
    msg += `💳 *PAGAMENTO:*\n`;
    const pixKey = activeRestaurant?.paymentMethods?.pixKey || '86998030143';
    let methodLabel = '';
    if (order.paymentMethod === 'credit') methodLabel = 'Cartão de Crédito (na entrega)';
    else if (order.paymentMethod === 'debit') methodLabel = 'Cartão de Débito (na entrega)';
    else if (order.paymentMethod === 'pix') methodLabel = `Pix (Chave: ${pixKey})`;
    else if (order.paymentMethod === 'cash') methodLabel = 'Dinheiro';
    
    msg += `*Forma:* ${methodLabel}\n`;
    if (order.changeFor) {
      msg += `*Observação:* ${order.changeFor}\n`;
    }
    msg += `\n`;
    
    msg += `==================================\n\n`;
    msg += `💵 *RESUMO FINANCEIRO:*\n`;
    msg += `*Subtotal:* R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
    if (order.discount > 0) {
      msg += `*Desconto:* - R$ ${order.discount.toFixed(2).replace('.', ',')}\n`;
    }
    if (order.paymentMethod === 'pix') {
      const pixBonus = order.total * 0.05;
      msg += `*Bônus Pix (5%):* - R$ ${pixBonus.toFixed(2).replace('.', ',')}\n`;
      msg += `*TOTAL FINAL:* *R$ ${(order.total * 0.95).toFixed(2).replace('.', ',')}*\n`;
    } else {
      msg += `*Taxa de Entrega:* R$ ${order.shipping.toFixed(2).replace('.', ',')}\n`;
      msg += `*TOTAL FINAL:* *R$ ${order.total.toFixed(2).replace('.', ',')}*\n`;
    }
    msg += `\n⏱️ *Previsão de Entrega:* ${order.estimatedTime || '25 - 35 min'}\n`;
    msg += `\n_Cardápio Digital WP Integrada_\n`;
    
    return encodeURIComponent(msg);
  };

  // Local temp copy of address for edit inputs
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [tempStreet, setTempStreet] = useState(address.street);
  const [tempDetails, setTempDetails] = useState(address.details);
  const [tempNeighborhood, setTempNeighborhood] = useState(address.neighborhood);

  // Calculations
  const subtotal = cartItems.reduce((acc, curr) => {
    const sidesPrice = curr.selectedSides?.reduce((s, side) => s + side.price, 0) || 0;
    return acc + (curr.menuItem.price + sidesPrice) * curr.quantity;
  }, 0);

  // Apply Coupon (using dynamic coupons database)
  let discountValue = 0;
  const activeCoupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
  if (activeCoupon) {
    if (activeCoupon.type === 'percent') {
      discountValue = subtotal * (activeCoupon.discount / 100);
    } else {
      discountValue = Math.min(subtotal, activeCoupon.discount);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountValue + activeDeliveryFee);

  const saveNewAddress = () => {
    setAddress({
      ...address,
      street: tempStreet,
      details: tempDetails,
      neighborhood: tempNeighborhood,
    });
    setIsChangingAddress(false);
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);

    // Simulate standard network delay
    setTimeout(async () => {
      const uniqueId = `ZF-${Math.floor(Math.random() * 9000) + 1000}`;
      const newOrder: Order = {
        id: uniqueId,
        date: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        items: [...cartItems],
        subtotal,
        discount: discountValue,
        shipping: activeDeliveryFee,
        total: finalTotal,
        status: 'Pendente',
        address,
        paymentMethod,
        changeFor: (paymentMethod === 'cash' && needChange) ? `Troco para R$ ${changeFor}` : undefined,
        estimatedTime: activeRestaurant?.deliveryEstimatedTime || '25 - 35 min',
        restaurantId: activeRestaurant?.id || 'rest-1'
      };

      // Persist to tenant database
      try {
        await saveOrderToDB(newOrder, activeRestaurant?.id || 'rest-1');
      } catch (err) {
        console.error('Failed to persist order to tenant DB:', err);
      }

      setSimulatedOrder(newOrder);
      onAddOrder(newOrder);
      setIsProcessing(false);
      setShowSuccessModal(true);

      // Open store's WhatsApp automatically with the receipt!
      const waText = generateOrderMessage(newOrder, customerName, customerPhone);
      const storePhone = activeRestaurant?.whatsapp 
        ? cleanPhoneNumber(activeRestaurant.whatsapp) 
        : '5586998030143';
      const storeWaUrl = `https://wa.me/${storePhone}?text=${waText}`;
      try {
        window.open(storeWaUrl, '_blank');
      } catch (err) {
        console.error('Pop-up blocked:', err);
      }
      setSentToStore(true);
    }, 1500);
  };

  const handleCompleteSuccess = () => {
    setShowSuccessModal(false);
    onClearCart(); // empty cart
    onChangeScreen('orders'); // navigate to their order index tracking list!
  };

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-48">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-5 justify-between max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-sm">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-primary-orange p-1 hover:bg-white/5 rounded-full outline-none mr-3 transition-transform active:scale-95 shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold text-base text-white">Finalizar Pedido</h1>
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
            <span className="text-xs font-black tracking-tight text-white leading-none">
              {activeRestaurant ? activeRestaurant.name : 'Urban Burguer'}
            </span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">
              {activeRestaurant?.tag || 'Artesanal'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Form container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-4">
          {/* Left Column: Delivery details & payments (7 columns out of 12) */}
          <div className="md:col-span-7 space-y-6">
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

            <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center gap-2 border border-white/5">
              <span className="bg-primary-orange/10 p-2.5 rounded-xl text-primary-orange">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-extrabold text-primary-accent uppercase tracking-wider block">PREVISÃO DE ENTREGA</span>
                <p className="text-xs text-white font-bold">25 a 35 minutos para o seu endereço</p>
              </div>
            </div>

            {/* Delivery Address Section */}
            <section className="space-y-3">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary-orange rounded-full" />
            Endereço de Entrega
          </h2>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-white/5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary-orange fill-primary-orange/20" />
            </div>
            <div className="flex-grow space-y-1">
              {isChangingAddress ? (
                <div className="space-y-2 mt-1">
                  <input
                    type="text"
                    value={tempStreet}
                    onChange={(e) => setTempStreet(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-surface-container text-white border border-white/10 outline-none"
                    placeholder="Rua e Número, Ex: Rua das Gastronomias, 123"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tempNeighborhood}
                      onChange={(e) => setTempNeighborhood(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-surface-container text-white border border-white/10 outline-none"
                      placeholder="Bairro"
                    />
                    <input
                      type="text"
                      value={tempDetails}
                      onChange={(e) => setTempDetails(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-surface-container text-white border border-white/10 outline-none"
                      placeholder="Ap, Bloco"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveNewAddress}
                      className="bg-primary-orange text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsChangingAddress(false)}
                      className="bg-surface-container-high text-on-surface-variant text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-extrabold text-white">{address.street}</p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {address.details && `${address.details} • `}
                    {address.cep ? `CEP: ${address.cep}` : ''}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">{address.neighborhood}, {address.cityState}</p>
                  <button
                    onClick={() => {
                      setTempStreet(address.street);
                      setTempDetails(address.details);
                      setTempNeighborhood(address.neighborhood);
                      setIsChangingAddress(true);
                    }}
                    className="mt-2 text-primary-orange font-bold text-xs hover:opacity-80 transition-opacity uppercase tracking-wider block"
                  >
                    Alterar Endereço
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Map Preview */}
          <div className="w-full h-32 rounded-2xl overflow-hidden relative border border-white/5 shadow-inner">
            <img
              alt="Map location"
              className="w-full h-full object-cover invert opacity-30 select-none pointer-events-none"
              src={MOCK_MAP_IMAGE_URL}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 bg-primary-orange rounded-full flex items-center justify-center shadow-2xl relative">
                <span className="absolute animate-ping w-9 h-9 rounded-full bg-primary-orange opacity-40" />
                <MapPin className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-surface-container-high/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-primary-accent tracking-wider uppercase border border-white/5">
              Localização Atual
            </div>
          </div>
        </section>

        {/* Payment Method Section */}
        <section className="space-y-4">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary-orange rounded-full" />
            Forma de Pagamento
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Credit Card */}
            <div
              onClick={() => setPaymentMethod('credit')}
              className={`cursor-pointer border p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] ${
                paymentMethod === 'credit'
                  ? 'border-primary-orange bg-surface-container-low ring-2 ring-primary-orange/15 shadow-lg'
                  : 'border-white/5 bg-surface-container-lowest hover:border-white/10'
              }`}
            >
              <CreditCard className="w-5 h-5 text-on-surface-variant" />
              <div className="flex-grow text-left">
                <p className="font-extrabold text-sm text-white">Cartão de Crédito</p>
                <p className="text-xs text-on-surface-variant font-medium">Pagar na maquininha na entrega</p>
              </div>
              <div className="flex shrink-0">
                {paymentMethod === 'credit' ? (
                  <CheckCircle className="w-5 h-5 text-primary-orange fill-primary-orange/10" />
                ) : (
                  <div className="w-5 h-5 border-2 border-outline-variant rounded-full" />
                )}
              </div>
            </div>

            {/* Debit Card */}
            <div
              onClick={() => setPaymentMethod('debit')}
              className={`cursor-pointer border p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] ${
                paymentMethod === 'debit'
                  ? 'border-primary-orange bg-surface-container-low ring-2 ring-primary-orange/15 shadow-lg'
                  : 'border-white/5 bg-surface-container-lowest hover:border-white/10'
              }`}
            >
              <CreditCard className="w-5 h-5 text-on-surface-variant" />
              <div className="flex-grow text-left">
                <p className="font-extrabold text-sm text-white">Cartão de Débito</p>
                <p className="text-xs text-on-surface-variant font-medium">Pagar na maquininha na entrega</p>
              </div>
              <div className="flex shrink-0">
                {paymentMethod === 'debit' ? (
                  <CheckCircle className="w-5 h-5 text-primary-orange fill-primary-orange/10" />
                ) : (
                  <div className="w-5 h-5 border-2 border-outline-variant rounded-full" />
                )}
              </div>
            </div>

            {/* Pix */}
            <div
              onClick={() => setPaymentMethod('pix')}
              className={`cursor-pointer border p-4 rounded-2xl flex flex-col gap-3 transition-all ${
                paymentMethod === 'pix'
                  ? 'border-primary-orange bg-surface-container-low ring-2 ring-primary-orange/15 shadow-lg'
                  : 'border-white/5 bg-surface-container-lowest hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4 w-full">
                <Sparkles className="w-5 h-5 text-on-surface-variant" />
                <div className="flex-grow text-left">
                  <p className="font-extrabold text-sm text-white">Pix</p>
                  <p className="text-xs text-on-surface-variant font-medium">Transferência instantânea</p>
                </div>
                <div className="flex shrink-0">
                  {paymentMethod === 'pix' ? (
                    <CheckCircle className="w-5 h-5 text-primary-orange fill-primary-orange/10" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-outline-variant rounded-full" />
                  )}
                </div>
              </div>

              {/* Explicit Pix Details Panel if selected */}
              {paymentMethod === 'pix' && (
                <div
                  className="bg-surface-container-lowest p-3.5 rounded-xl border border-white/5 mt-1 text-left space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <span className="text-[9px] font-extrabold text-primary-accent uppercase tracking-wider block">
                      Chave Pix ({activeRestaurant?.paymentMethods?.pixKeyType || 'Celular'})
                    </span>
                    <p className="text-sm font-mono font-black text-white selection:bg-primary-orange/20">
                      {activeRestaurant?.paymentMethods?.pixKey || '86 99803-0143'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider block font-sans">Beneficiário</span>
                    <p className="text-xs font-bold text-white">
                      {activeRestaurant?.paymentMethods?.pixReceiverName || activeRestaurant?.name || 'WP Integrada'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const keyToCopy = (activeRestaurant?.paymentMethods?.pixKey || '86998030143').replace(/\D/g, '');
                      navigator.clipboard.writeText(keyToCopy || activeRestaurant?.paymentMethods?.pixKey || '86998030143');
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2000);
                    }}
                    className="w-full h-10 mt-1 bg-primary-orange/10 hover:bg-primary-orange/15 text-primary-orange border border-primary-orange/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Chave Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Chave Pix</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-on-surface-variant leading-normal text-center mt-1">
                    Copie a chave acima e efetue o pagamento no aplicativo do seu banco para agilizar a entrega do seu pedido!
                  </p>
                </div>
              )}
            </div>

            {/* Money */}
            <div
              onClick={() => setPaymentMethod('cash')}
              className={`cursor-pointer border p-4 rounded-2xl flex flex-col gap-3 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-primary-orange bg-surface-container-low ring-2 ring-primary-orange/15 shadow-lg'
                  : 'border-white/5 bg-surface-container-lowest hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4 w-full">
                <Coins className="w-5 h-5 text-on-surface-variant" />
                <div className="flex-grow text-left">
                  <p className="font-extrabold text-sm text-white">Dinheiro</p>
                  <p className="text-xs text-on-surface-variant font-medium">Pagar em notas na entrega</p>
                </div>
                <div className="flex shrink-0">
                  {paymentMethod === 'cash' ? (
                    <CheckCircle className="w-5 h-5 text-primary-orange fill-primary-orange/10" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-outline-variant rounded-full" />
                  )}
                </div>
              </div>

              {/* Explicit cash details Panel if selected */}
              {paymentMethod === 'cash' && (
                <div
                  className="bg-surface-container-lowest p-3.5 rounded-xl border border-white/5 mt-1 text-left space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      id="need-change"
                      type="checkbox"
                      checked={needChange}
                      onChange={(e) => setNeedChange(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-white/10 text-primary-orange bg-surface-container focus:ring-0 outline-none cursor-pointer"
                    />
                    <label htmlFor="need-change" className="text-xs font-bold text-white select-none cursor-pointer">
                      Precisa de troco?
                    </label>
                  </div>

                  {needChange && (
                    <div className="space-y-1 animate-fadeIn duration-200">
                      <label className="text-[10px] font-extrabold text-primary-accent uppercase tracking-wider block font-sans">
                        Troco para quanto?
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">R$</span>
                        <input
                          type="text"
                          placeholder="Ex: 50,00 ou 100,00"
                          value={changeFor}
                          onChange={(e) => setChangeFor(e.target.value)}
                          className="w-full text-xs pl-8 pr-4 py-2.5 rounded-xl bg-surface-container text-white border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
          </div>

          {/* Right Column: Order summary and pricing (5 columns out of 12) */}
          <div className="md:col-span-5 space-y-6">
            {/* Resumo do Pedido List */}
            <section className="space-y-3">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary-orange/70 rounded-full" />
            Resumo do Pedido
          </h2>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-white/5 space-y-4">
            {cartItems.map((item, i) => {
              const sidesSum = item.selectedSides?.reduce((acc, side) => acc + side.price, 0) || 0;
              const unitTotal = item.menuItem.price + sidesSum;
              return (
                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      alt={item.menuItem.name}
                      className="w-12 h-12 rounded-lg object-cover bg-surface-container-high"
                      referrerPolicy="no-referrer"
                      src={item.menuItem.imageUrl}
                    />
                    <div>
                      <p className="text-xs font-extrabold text-white">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant italic">
                        {item.menuItem.category} {item.selectedSides && item.selectedSides.length > 0 && `(+ ${item.selectedSides.length} opcionais)`}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 border border-amber-500/15 inline-block">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-black text-white">
                    R$ {(unitTotal * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}

            <div className="space-y-2 pt-2 text-xs font-semibold text-on-surface-variant">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Descontos</span>
                  <span className="font-extrabold">- R$ {discountValue.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {paymentMethod === 'pix' && (
                <div className="flex justify-between text-emerald-400">
                  <span>Bônus Pix (5%)</span>
                  <span className="font-extrabold">- R$ {(finalTotal * 0.05).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
               <div className="flex justify-between">
                <span>Taxa de Entrega</span>
                {activeDeliveryFee > 0 ? (
                  <span className="text-white font-bold">R$ {activeDeliveryFee.toFixed(2).replace('.', ',')}</span>
                ) : (
                  <span className="text-primary-orange font-bold uppercase text-[10px] bg-primary-orange/10 px-1.5 py-0.5 rounded">Grátis</span>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-3 font-extrabold text-sm">
                <span className="text-white">Total</span>
                <span className="text-primary-orange font-black text-base">
                  R$ {(paymentMethod === 'pix' ? finalTotal * 0.95 : finalTotal).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </section>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Final Checkout Bar */}
      <div className="fixed bottom-0 w-full z-40 bg-surface-container-low/95 backdrop-blur-3xl pt-5 pb-8 px-5 border-t border-white/10 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 rounded-t-[2.5rem] shadow-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-[0.10em]">Total a Pagar</span>
              <span className="text-xl font-black text-primary-orange">
                R$ {(paymentMethod === 'pix' ? finalTotal * 0.95 : finalTotal).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-[0.10em]">Entrega Estimada</span>
              <p className="text-xs font-black text-white">25 - 35 minutos</p>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full bg-primary-orange text-white h-14 rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-primary-orange/20 outline-none hover:bg-opacity-95"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2 font-bold justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Conectando com a Cozinha...
              </span>
            ) : (
              <>
                Confirmar e Pagar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL OVERLAY */}
      <AnimatePresence>
        {showSuccessModal && simulatedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-5 outline-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-surface-container rounded-3xl p-6 border border-white/10 w-full max-w-sm text-center shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Pedido Confirmado!</h3>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  A cozinha do Urban Burguer já recebeu o seu pedido <span className="text-primary-orange font-bold font-mono">#{simulatedOrder.id}</span> e começou os preparativos.
                </p>
              </div>

              {/* Receipt details */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 text-left border border-white/5 space-y-2.5 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Chave do Pedido</span>
                  <span className="font-bold text-primary-orange font-mono">#{simulatedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Horário</span>
                  <span className="text-white font-medium">{simulatedOrder.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrega Estimada</span>
                  <span className="text-emerald-400 font-bold block">25 a 35 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de Pagamento</span>
                  <span className="text-white font-medium">
                    {simulatedOrder.paymentMethod === 'credit' && 'Cartão de Crédito'}
                    {simulatedOrder.paymentMethod === 'debit' && 'Cartão de Débito'}
                    {simulatedOrder.paymentMethod === 'pix' && 'Pix'}
                    {simulatedOrder.paymentMethod === 'cash' && 'Dinheiro'}
                  </span>
                </div>
                {simulatedOrder.changeFor && (
                  <div className="flex justify-between text-[11px] text-primary-orange">
                    <span>Observação troco</span>
                    <span className="font-bold">{simulatedOrder.changeFor}</span>
                  </div>
                )}
                <hr className="border-white/5 my-1" />
                <div className="flex justify-between font-bold">
                  <span className="text-white font-extrabold">Total Final</span>
                  <span className="text-primary-orange font-black">
                    R$ {simulatedOrder.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* WHATSAPP DISPATCH ACTIONS */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="text-center">
                  <span className="text-[9px] font-black tracking-wider text-primary-orange uppercase block">
                    🚀 DISPARAR PEDIDO NO WHATSAPP
                  </span>
                  <p className="text-[9px] text-on-surface-variant/80 font-medium leading-relaxed mt-0.5">
                    Envie o pedido para a cozinha preparar e para você acompanhar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Store dispatch button */}
                  <a
                    href={`https://wa.me/5586998166138?text=${generateOrderMessage(simulatedOrder, customerName, customerPhone)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setSentToStore(true)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all active:scale-95 ${
                      sentToStore
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/25 border-emerald-500/40 text-white shadow-md shadow-emerald-500/5 animate-pulse'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold flex items-center gap-1.5 justify-center">
                      <Send className="w-3 h-3 text-emerald-400" /> 1. Hamburgueria
                    </span>
                    <span className="text-[8px] font-semibold text-emerald-400/90 mt-1 block uppercase tracking-wider">
                      {sentToStore ? '✓ Enviado!' : 'Fazer Preparar'}
                    </span>
                  </a>

                  {/* Client dispatch button */}
                  {cleanPhoneNumber(customerPhone) ? (
                    <a
                      href={`https://wa.me/${cleanPhoneNumber(customerPhone)}?text=${generateOrderMessage(simulatedOrder, customerName, customerPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setSentToClient(true)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all active:scale-95 ${
                        sentToClient
                          ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent'
                          : 'bg-primary-accent/20 hover:bg-primary-accent/25 border-primary-accent/40 text-white shadow-md shadow-primary-accent/5'
                      }`}
                    >
                      <span className="text-[10px] font-extrabold flex items-center gap-1.5 justify-center">
                        <MessageSquare className="w-3 h-3 text-primary-accent" /> 2. Meu Whats
                      </span>
                      <span className="text-[8px] font-semibold text-primary-accent/90 mt-1 block uppercase tracking-wider">
                        {sentToClient ? '✓ Enviado!' : 'Acompanhar'}
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 text-on-surface-variant/40 text-center opacity-60">
                      <span className="text-[10px] font-extrabold flex items-center gap-1.5 justify-center">
                        <MessageSquare className="w-3 h-3" /> 2. Meu Whats
                      </span>
                      <span className="text-[8px] font-semibold mt-1 block uppercase tracking-wider">
                        Sem Whats
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[8px] text-on-surface-variant/60 text-center leading-normal">
                  *Clique nos botões para abrir as conversas correspondentes pré-formatadas.
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompleteSuccess}
                className="w-full h-12 bg-primary-orange text-white rounded-xl font-extrabold active:scale-95 hover:bg-opacity-95 shadow-lg shadow-primary-orange/15 text-sm transition-transform"
              >
                Acompanhar Preparação
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
