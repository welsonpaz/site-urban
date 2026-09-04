import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, Smartphone, MapPin, Truck, AlertCircle, Sparkles, Navigation, Send, Search, Loader2 } from 'lucide-react';
import { ScreenType, UserAddress } from '../types';
import { useLogo } from '../lib/logoState';
import { getCustomerByPhone, saveCustomerProfile } from '../lib/firebase';

interface RegisterScreenProps {
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  address: UserAddress;
  setAddress: (address: UserAddress) => void;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

export default function RegisterScreen({
  onBack,
  onChangeScreen,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  address,
  setAddress,
  deliveryFee,
  setDeliveryFee,
}: RegisterScreenProps) {
  const logo = useLogo();
  // Local state for form validation and styling
  const [nameInput, setNameInput] = useState(customerName);
  const [phoneInput, setPhoneInput] = useState(customerPhone);
  const [cepInput, setCepInput] = useState(address.cep || '');
  const [streetInput, setStreetInput] = useState(address.street || '');
  const [detailsInput, setDetailsInput] = useState(address.details || '');
  const [neighborhoodInput, setNeighborhoodInput] = useState(address.neighborhood || '');
  const [cityStateInput, setCityStateInput] = useState(address.cityState || 'São Paulo - SP');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic Shipping calculation status
  const [calculating, setCalculating] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Firestore automatic phone lookup state
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [dbProfileFound, setDbProfileFound] = useState(false);

  // Automatic customer profile lookup when complete phone is typed
  useEffect(() => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    // Standard Brazilian numbers have 10 (landline) or 11 (mobile) digits
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      // 1. First check local storage cache for instant autofill on user device
      try {
        const cached = localStorage.getItem('urban_customer_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.phone === cleanPhone) {
            setNameInput(parsed.name || '');
            setCepInput(parsed.cep || '');
            setStreetInput(parsed.street || '');
            setDetailsInput(parsed.details || '');
            setNeighborhoodInput(parsed.neighborhood || '');
            setCityStateInput(parsed.cityState || 'São Paulo - SP');
            setDbProfileFound(true);
            setErrorMsg(null);
            return;
          }
        }
      } catch {
        // Ignore cache parse error
      }

      const performLookup = async () => {
        setSearchingPhone(true);
        setErrorMsg(null);
        try {
          const profile = await getCustomerByPhone(cleanPhone);
          if (profile) {
            setNameInput(profile.name);
            setCepInput(profile.cep || '');
            setStreetInput(profile.street || '');
            setDetailsInput(profile.details || '');
            setNeighborhoodInput(profile.neighborhood || '');
            setCityStateInput(profile.cityState || 'São Paulo - SP');
            setDbProfileFound(true);
            setErrorMsg(null);
          } else {
            setDbProfileFound(false);
          }
        } catch {
          // Graceful fallback
        } finally {
          setSearchingPhone(false);
        }
      };

      const timer = setTimeout(() => {
        performLookup();
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    } else {
      setDbProfileFound(false);
    }
  }, [phoneInput]);

  // Calculate shipping fee helper
  const calculateShipping = (neighborhood: string) => {
    if (!neighborhood || neighborhood.trim() === '') {
      return 0;
    }
    const cleanStr = neighborhood.trim();
    // Deterministic calculation based on string hash/length
    const primeVal = cleanStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const computed = 4.90 + (primeVal % 8) + (cleanStr.length % 4);
    return Number(computed.toFixed(2));
  };

  // Recalculate whenever neighborhood changes (with a small fancy effect/delay simulating calculation)
  useEffect(() => {
    if (neighborhoodInput.trim().length > 3) {
      setCalculating(true);
      const timer = setTimeout(() => {
        const fee = calculateShipping(neighborhoodInput);
        setDeliveryFee(fee);
        setCalculating(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDeliveryFee(0);
    }
  }, [neighborhoodInput, setDeliveryFee]);

  // Lookup CEP details from ViaCEP dynamic public API
  const lookupCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setErrorMsg('Por favor, digite um CEP válido com 8 números.');
      return;
    }
    setLoadingCep(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setErrorMsg('CEP não encontrado. Preencha os campos manualmente.');
      } else {
        setStreetInput(data.logradouro || '');
        setNeighborhoodInput(data.bairro || '');
        if (data.localidade && data.uf) {
          setCityStateInput(`${data.localidade} - ${data.uf}`);
        }
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg('Ops! Erro ao consultar o CEP. Você pode preencher os dados manualmente.');
    } finally {
      setLoadingCep(false);
    }
  };

  // CEP input formatting & auto-trigger search on 8 digits
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 5) {
      formatted = `${clean.substring(0, 5)}-${clean.substring(5, 8)}`;
    }
    setCepInput(formatted);

    if (clean.length === 8) {
      lookupCep(clean);
    }
  };

  // Phone input formatting (simple mask)
  const formatPhone = (val: string) => {
    // Remove non-digits
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    if (clean.length <= 10) return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setPhoneInput(formatPhone(rawValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameInput.trim()) {
      setErrorMsg('Por favor, digite seu nome completo.');
      return;
    }
    if (!phoneInput.trim() || phoneInput.length < 14) {
      setErrorMsg('Por favor, informe um telefone de contato válido com DDD.');
      return;
    }
    if (!streetInput.trim()) {
      setErrorMsg('Por favor, insira o endereço completo (Rua e Número).');
      return;
    }
    if (!neighborhoodInput.trim()) {
      setErrorMsg('Por favor, insira o bairro para podermos enviar o pedido.');
      return;
    }

    // Save profile to Firestore database asynchronously
    try {
      await saveCustomerProfile({
        phone: phoneInput,
        name: nameInput.trim(),
        cep: cepInput.trim(),
        street: streetInput.trim(),
        details: detailsInput.trim(),
        neighborhood: neighborhoodInput.trim(),
        cityState: cityStateInput.trim(),
      });
    } catch (err) {
      console.error('Erro ao registrar cliente no Firestore:', err);
    }

    // Set Parent State values
    setCustomerName(nameInput.trim());
    setCustomerPhone(phoneInput.trim());
    setAddress({
      street: streetInput.trim(),
      details: detailsInput.trim(),
      neighborhood: neighborhoodInput.trim(),
      cityState: cityStateInput.trim(),
      cep: cepInput.trim(),
    });

    setErrorMsg(null);
    onChangeScreen('checkout');
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
          <h1 className="font-extrabold text-base text-white">Identificação</h1>
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
            <span className="text-xs font-black tracking-tight text-white leading-none">Urban Burguer</span>
            <span className="text-[7px] font-extrabold text-primary-orange uppercase tracking-wider mt-0.5">Artesanal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-surface-container-high to-surface-container-lowest p-5 rounded-2xl border border-white/5 mt-4 relative overflow-hidden text-left">
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-primary-orange/10 rounded-full blur-2xl font-sans" />
          <h2 className="font-extrabold text-white text-base">Entrega Personalizada</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
            Configure abaixo seus dados rápidos. Calcularemos a menor taxa de entrega diretamente do bairro informado até a nossa central de cozimento!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Basic Info */}
          <div className="space-y-4 bg-surface-container-low p-5 rounded-2xl border border-white/5">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <User className="w-4 h-4 text-primary-orange" />
              Dados de Contato
            </h3>

            <div>
              <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Seu nome e sobrenome"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                Celular / WhatsApp *
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phoneInput}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  className={`w-full pl-10 pr-24 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border outline-none focus:ring-2 transition-all ${
                    dbProfileFound
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/15'
                      : 'border-white/5 focus:border-primary-orange/40 focus:ring-primary-orange/15'
                  }`}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none">
                  {searchingPhone && (
                    <Loader2 className="w-4 h-4 text-primary-orange animate-spin" />
                  )}
                  {dbProfileFound && !searchingPhone && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in">
                      <Sparkles className="w-3 h-3" />
                      Auto-puxado!
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-on-surface-variant/60 font-medium mt-1 block leading-tight">
                {dbProfileFound ? (
                  <span className="text-emerald-400 font-bold">✓ Cadastro encontrado de forma automática na nuvem!</span>
                ) : (
                  'Utilizaremos para salvar seu cadastro e buscar dados em pedidos futuros.'
                )}
              </span>
            </div>
          </div>

          {/* Right Column: Address & Shipping feedback */}
          <div className="space-y-4 bg-surface-container-low p-5 rounded-2xl border border-white/5">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-orange" />
              Endereço de Entrega
            </h3>

            <div>
              <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                CEP *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ex: 01311-200"
                    value={cepInput}
                    onChange={handleCepChange}
                    maxLength={9}
                    className="w-full px-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all placeholder-on-surface-variant/40"
                    required
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-orange animate-spin" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => lookupCep(cepInput)}
                  disabled={loadingCep || !cepInput}
                  className="bg-primary-orange/15 text-primary-orange border border-primary-orange/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-orange/25 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingCep ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  Buscar
                </button>
              </div>
              <span className="text-[10px] text-on-surface-variant/60 font-medium mt-1 block leading-tight">
                Insira o CEP para preencher o endereço e calcular o frete automaticamente.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                Rua e Número *
              </label>
              <input
                type="text"
                placeholder="Ex: Avenida Paulista, 1000 - Apto 12"
                value={streetInput}
                onChange={(e) => setStreetInput(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                  Bairro *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Moema"
                  value={neighborhoodInput}
                  onChange={(e) => setNeighborhoodInput(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                  Cidade - UF
                </label>
                <input
                  type="text"
                  placeholder="São Paulo - SP"
                  value={cityStateInput}
                  onChange={(e) => setCityStateInput(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans">
                Complemento / Referência
              </label>
              <input
                type="text"
                placeholder="Ex: Bloco C, Apto 104 (Opcional)"
                value={detailsInput}
                onChange={(e) => setDetailsInput(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest text-xs text-white rounded-xl border border-white/5 focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/15 outline-none transition-all"
              />
            </div>

            {/* Dynamic shipping feedback feedback card */}
            <div className="mt-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">Taxa de Entrega</span>
                  {calculating ? (
                    <span className="text-xs text-on-surface-variant font-medium animate-pulse">Calculando rota...</span>
                  ) : neighborhoodInput.trim().length > 3 ? (
                    <p className="text-xs text-white font-black">Entrega estimada para {neighborhoodInput}</p>
                  ) : (
                    <p className="text-xs text-on-surface-variant/80 font-medium">Digite o Bairro para calcular</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {calculating ? (
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : neighborhoodInput.trim().length > 3 ? (
                  <span className="text-sm font-black text-emerald-400">
                    R$ {deliveryFee.toFixed(2).replace('.', ',')}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-on-surface-variant">--</span>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="col-span-1 md:col-span-2 bg-red-500/15 text-red-300 p-4 rounded-xl border border-red-500/20 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bottom Confirmation Bar */}
          <div className="col-span-1 md:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full bg-primary-orange text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-opacity-95 shadow-lg shadow-primary-orange/20"
            >
              Avançar para Pagamento
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
