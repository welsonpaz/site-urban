import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Search, CheckCircle, XCircle, ArrowLeft, 
  ExternalLink, Edit3, Trash2, Shield, Store, Phone, 
  MapPin, Clock, DollarSign, RefreshCw, AlertTriangle, Eye, Layers,
  LogOut, Lock, KeyRound, UserCheck, Mail, ShieldAlert, Check
} from 'lucide-react';
import { Restaurant, RestaurantPlan, RestaurantStatus } from '../types';
import { getAllRestaurants, saveRestaurantToDB, deleteRestaurantFromDB, setActiveSlug } from '../lib/tenantService';
import { 
  loginWithEmail, 
  registerWithEmail,
  logoutUser, 
  subscribeToAuthState, 
  AuthProfile, 
  assignRestaurantAdminRole
} from '../lib/authService';

interface SuperAdminScreenProps {
  onBack: () => void;
  onEnterRestaurantAdmin?: (restaurant: Restaurant) => void;
  onViewPublicMenu?: (slug: string) => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export default function SuperAdminScreen({
  onBack,
  onEnterRestaurantAdmin,
  onViewPublicMenu,
  onSelectRestaurant,
}: SuperAdminScreenProps) {
  // Auth state
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('WelsonPaz@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Tenant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    slug: '',
    segment: 'Hamburgueria',
    phone: '',
    whatsapp: '',
    address: '',
    neighborhood: 'Centro',
    city: 'Teresina',
    state: 'PI',
    plan: 'Profissional',
    status: 'active',
    openingTime: '18:00',
    closingTime: '23:30',
    daysText: 'Terça a Domingo',
    defaultDeliveryFee: 5.0,
    logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop',
    subtitle: 'Cardápio Digital Oficial',
    tag: 'QUALIDADE • AGILIDADE',
    categories: ['Principais', 'Bebidas', 'Sobremesas']
  });

  const [saving, setSaving] = useState(false);

  // Subscribe to real Firebase Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setAuthProfile(profile);
      setCheckingAuth(false);
      if (profile?.role === 'super_admin') {
        loadData();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllRestaurants();
      setRestaurants(list);
    } catch (err) {
      console.error('Erro ao carregar restaurantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha seu e-mail administrativo e a senha de acesso.');
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      if (isRegisterMode) {
        await registerWithEmail(loginEmail, loginPassword);
      } else {
        try {
          await loginWithEmail(loginEmail, loginPassword);
        } catch (signInErr: any) {
          const cleanEmail = loginEmail.toLowerCase().trim();
          // If account is not registered yet and matches the master superadmin email, attempt auto-initialization
          if (
            (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential') &&
            cleanEmail === 'welsonpaz@gmail.com'
          ) {
            try {
              await registerWithEmail(loginEmail, loginPassword);
              return;
            } catch (regErr: any) {
              if (regErr?.code === 'auth/email-already-in-use') {
                throw new Error('Senha incorreta para a conta Super Admin da WP Integrada.');
              }
              throw regErr;
            }
          }
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        setLoginError('Senha incorreta. Se ainda não cadastrou senha, selecione "Cadastrar Senha".');
      } else if (err?.code === 'auth/user-not-found') {
        setLoginError('Conta não encontrada. Clique na aba "Cadastrar Senha" para cadastrar seu primeiro acesso.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setLoginError('Esta conta já está cadastrada. Use a aba "Entrar com Senha".');
      } else if (err?.code === 'auth/weak-password') {
        setLoginError('A senha fornecida é muito fraca. Utilize pelo menos 6 caracteres.');
      } else {
        setLoginError(err?.message || 'Erro de autenticação no Firebase. Verifique seus dados.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthProfile(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Stats calculation
  const totalCount = restaurants.length;
  const activeCount = restaurants.filter(r => r.status === 'active').length;
  const inactiveCount = totalCount - activeCount;

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !search.trim() || 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `rest-${Date.now()}`,
      name: '',
      slug: '',
      segment: 'Hamburgueria',
      phone: '(86) 99803-0143',
      whatsapp: '5586998030143',
      address: 'Rua Comercial, 100',
      neighborhood: 'Centro',
      city: 'Teresina',
      state: 'PI',
      plan: 'Profissional',
      status: 'active',
      openingTime: '18:00',
      closingTime: '23:30',
      daysText: 'Terça a Domingo',
      statusMode: 'auto',
      openDays: [0, 2, 3, 4, 5, 6],
      defaultDeliveryFee: 5.0,
      deliveryFees: [
        { neighborhood: 'Centro', fee: 5.0 },
        { neighborhood: 'Bairro Novo', fee: 7.0 }
      ],
      paymentMethods: {
        pix: true,
        creditCard: true,
        debitCard: true,
        cash: true,
        pixKey: '86998030143'
      },
      logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop',
      subtitle: 'Cardápio Digital Oficial',
      tag: 'QUALIDADE • AGILIDADE',
      categories: ['Principais', 'Bebidas', 'Sobremesas'],
      createdAt: new Date().toISOString()
    });
    setManagerEmail('');
    setIsCreating(true);
    setEditingRestaurant(null);
  };

  const handleOpenEdit = (rest: Restaurant) => {
    setFormData({ ...rest });
    setManagerEmail('');
    setEditingRestaurant(rest);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.slug?.trim() || !formData.whatsapp?.trim()) {
      alert('Por favor, preencha o Nome, o Slug e o WhatsApp do restaurante.');
      return;
    }

    setSaving(true);
    try {
      const restId = editingRestaurant ? editingRestaurant.id : (formData.id || `rest-${Date.now()}`);
      const payload: Restaurant = {
        id: restId,
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().trim(),
        segment: formData.segment || 'Geral',
        phone: formData.phone || '',
        whatsapp: formData.whatsapp.trim(),
        address: formData.address || '',
        neighborhood: formData.neighborhood || '',
        city: formData.city || 'Teresina',
        state: formData.state || 'PI',
        plan: formData.plan || 'Profissional',
        status: formData.status || 'active',
        openingTime: formData.openingTime || '18:00',
        closingTime: formData.closingTime || '23:30',
        daysText: formData.daysText || 'Todos os dias',
        statusMode: formData.statusMode || 'auto',
        openDays: formData.openDays || [0, 1, 2, 3, 4, 5, 6],
        defaultDeliveryFee: formData.defaultDeliveryFee || 5.0,
        deliveryFees: formData.deliveryFees || [],
        paymentMethods: formData.paymentMethods || {
          pix: true,
          creditCard: true,
          debitCard: true,
          cash: true,
          pixKey: formData.whatsapp || ''
        },
        logoUrl: formData.logoUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop',
        coverUrl: formData.coverUrl,
        subtitle: formData.subtitle || '',
        tag: formData.tag || '',
        categories: formData.categories || ['Principais', 'Bebidas'],
        createdAt: editingRestaurant?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveRestaurantToDB(payload);

      // If manager email was provided, assign in restaurant_admins
      if (managerEmail.trim()) {
        try {
          // Normalize pseudo-uid or store mapping
          const sanitizedUid = managerEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
          await assignRestaurantAdminRole(sanitizedUid, managerEmail, restId);
        } catch (e) {
          console.warn('Erro ao vincular gerente:', e);
        }
      }

      await loadData();
      setIsCreating(false);
      setEditingRestaurant(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar restaurante.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (restaurant: Restaurant) => {
    const newStatus: RestaurantStatus = restaurant.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = newStatus === 'inactive'
      ? `Deseja realmente desativar o restaurante "${restaurant.name}"? O cardápio público ficará indisponível.`
      : `Deseja ativar o restaurante "${restaurant.name}"?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const updated = { ...restaurant, status: newStatus, updatedAt: new Date().toISOString() };
      await saveRestaurantToDB(updated);
      setRestaurants(prev => prev.map(r => r.id === restaurant.id ? updated : r));
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar status do restaurante.');
    }
  };

  const handleDelete = async (restaurant: Restaurant) => {
    if (!confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o restaurante "${restaurant.name}" e desvincular seu cardápio?`)) {
      return;
    }
    try {
      await deleteRestaurantFromDB(restaurant.id);
      setRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
      alert('Restaurante removido!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir restaurante.');
    }
  };

  // 1. Loading screen during Firebase Auth initialization
  if (checkingAuth) {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-3 border-primary-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-white">Verificando credenciais no Firebase...</p>
        <p className="text-xs text-on-surface-variant mt-1">Auditando permissões e funções administrativas</p>
      </div>
    );
  }

  // 2. Unauthenticated: Show WP Integrada Super Admin Login Gate
  if (!authProfile) {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-surface-container-low border border-primary-orange/30 p-6 md:p-8 rounded-3xl shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-primary-orange/10 border border-primary-orange/20 rounded-2xl text-primary-orange mb-1 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 bg-primary-orange/15 border border-primary-orange/30 rounded-full text-[10px] font-black tracking-widest text-primary-orange uppercase">
              Acesso Exclusivo
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">WP Integrada • Super Admin</h1>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Painel central e multi-tenant restrito exclusivamente aos administradores da <strong>WP Integrada</strong>. Identifique-se com suas credenciais de e-mail e senha.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-white/5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setLoginError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${!isRegisterMode ? 'bg-primary-orange text-white shadow-sm' : 'text-on-surface-variant hover:text-white'}`}
            >
              Entrar com Senha
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setLoginError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${isRegisterMode ? 'bg-primary-orange text-white shadow-sm' : 'text-on-surface-variant hover:text-white'}`}
            >
              Cadastrar Senha
            </button>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1.5">
                E-mail Administrativo WP Integrada
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="admin@wpintegrada.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white placeholder:text-on-surface-variant/40 focus:border-primary-orange focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1.5">
                {isRegisterMode ? 'Definir Nova Senha de Acesso' : 'Senha de Acesso'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white placeholder:text-on-surface-variant/40 focus:border-primary-orange focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-on-surface-variant hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-on-surface-variant/60 block mt-1">
                Mínimo de 6 caracteres. Autenticação criptografada via Firebase.
              </span>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : isRegisterMode ? (
                <span>Criar Acesso Super Admin</span>
              ) : (
                <span>Entrar no Super Admin WP Integrada</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-white/5">
            <button
              onClick={onBack}
              className="text-xs text-on-surface-variant hover:text-white transition-colors"
            >
              ← Voltar ao cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but unauthorized (Role is not super_admin)
  if (authProfile.role !== 'super_admin') {
    return (
      <div className="bg-dark-bg min-h-screen text-on-surface flex flex-col justify-center items-center px-4 py-12 text-center">
        <div className="w-full max-w-md bg-surface-container-low border border-red-500/30 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-black text-white">Acesso Negado: Super Admin</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A conta <strong className="text-white">{authProfile.email}</strong> foi autenticada via Firebase, porém não possui privilégios de <strong>Super Admin</strong> da WP Integrada.
            </p>
            <p className="text-[11px] text-on-surface-variant/70">
              O acesso a esta área é protegido por regras de controle de acesso estritas (RBAC).
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold text-xs rounded-xl transition-all"
            >
              Desconectar e Trocar de Conta
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 bg-surface-container-high hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
            >
              Voltar ao Cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Super Admin Dashboard
  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-32">
      {/* Super Admin Top Header */}
      <header className="fixed top-0 w-full z-50 bg-dark-bg/95 backdrop-blur-xl border-b border-primary-orange/20 h-16 flex items-center px-5 justify-between max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-lg shadow-black/40">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-primary-orange p-2 hover:bg-white/5 rounded-full outline-none mr-3 transition-transform active:scale-95 shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2 leading-none">
              <Shield className="w-5 h-5 text-primary-orange" />
              WP Integrada • Painel Super Admin
            </h1>
            <span className="text-[10px] text-primary-accent font-bold mt-0.5 leading-none">
              Autenticado: {authProfile.email} (Super Admin)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-black text-xs rounded-xl shadow-md shadow-primary-orange/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Estabelecimento
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
            title="Sair do Super Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-20 px-5 max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-2">
          <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant text-xs font-bold">
              <span>Total Cadastrados</span>
              <Store className="w-4 h-4 text-primary-orange" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white mt-2">{totalCount}</p>
            <span className="text-[10px] text-on-surface-variant/60 font-semibold mt-0.5">Empresas parceiras</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-emerald-500/20 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
              <span>Ativos no Ar</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-2">{activeCount}</p>
            <span className="text-[10px] text-emerald-500/60 font-semibold mt-0.5">Cardápios acessíveis</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-amber-500/20 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
              <span>Pausados / Inativos</span>
              <XCircle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-amber-400 mt-2">{inactiveCount}</p>
            <span className="text-[10px] text-amber-500/60 font-semibold mt-0.5">Sob manutenção</span>
          </div>
        </div>

        {/* Security Audit Badge */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-primary-orange/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-white">Controle de Acesso Baseado em Função (RBAC) Ativo</p>
              <p className="text-on-surface-variant text-[11px]">
                Nenhum PIN hardcoded. As regras do Firestore garantem isolamento estrito entre restaurantes e protegem dados administrativos.
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 bg-surface-container-high hover:bg-white/10 text-white rounded-xl flex items-center gap-1.5 font-bold shrink-0 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por nome, slug ou cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-white/5 rounded-xl text-xs text-white placeholder:text-on-surface-variant/50 focus:border-primary-orange focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-white/5 shrink-0">
            {(['all', 'active', 'inactive'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === mode 
                    ? 'bg-primary-orange text-white' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {mode === 'all' ? 'Todos' : mode === 'active' ? 'Ativos' : 'Inativos'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal: Create or Edit Restaurant */}
        <AnimatePresence>
          {(isCreating || editingRestaurant) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface-container-low border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary-orange/10 rounded-xl text-primary-orange">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        {isCreating ? 'Cadastrar Novo Restaurante' : `Editar: ${editingRestaurant?.name}`}
                      </h2>
                      <span className="text-[11px] text-on-surface-variant">
                        Configuração global do estabelecimento no ecossistema WP Integrada
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingRestaurant(null);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-on-surface-variant hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Nome do Estabelecimento *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Pizzaria Forno & Sabor"
                        value={formData.name || ''}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Slug (URL no Cardápio) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant/50 font-mono">/</span>
                        <input
                          type="text"
                          required
                          placeholder="fornoesabor"
                          value={formData.slug || ''}
                          onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                          className="w-full pl-6 pr-3 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white font-mono focus:border-primary-orange focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Segmento Culinário
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pizzaria, Hamburgueria"
                        value={formData.segment || ''}
                        onChange={e => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Plano Contratado *
                      </label>
                      <select
                        value={formData.plan || 'Profissional'}
                        onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value as RestaurantPlan }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      >
                        <option value="Básico">Básico</option>
                        <option value="Profissional">Profissional</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Status do Cardápio
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as RestaurantStatus }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      >
                        <option value="active">Ativo (Público)</option>
                        <option value="inactive">Inativo / Pausado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        WhatsApp de Pedidos (Com DDD) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="5586998030143"
                        value={formData.whatsapp || ''}
                        onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        E-mail do Gerente Autorizado (Firebase Auth)
                      </label>
                      <input
                        type="email"
                        placeholder="gerente@restaurante.com"
                        value={managerEmail}
                        onChange={e => setManagerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                      <span className="text-[10px] text-on-surface-variant/60 block mt-1">
                        Este gerente poderá acessar o painel deste restaurante usando suas credenciais no Firebase Auth.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Av. Principal, 123 - Centro"
                        value={formData.address || ''}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Taxa Padrão de Entrega (R$)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.defaultDeliveryFee || 5.0}
                        onChange={e => setFormData(prev => ({ ...prev, defaultDeliveryFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Horário de Abertura
                      </label>
                      <input
                        type="time"
                        value={formData.openingTime || '18:00'}
                        onChange={e => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                        Horário de Fechamento
                      </label>
                      <input
                        type="time"
                        value={formData.closingTime || '23:30'}
                        onChange={e => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      URL do Logotipo
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.logoUrl || ''}
                      onChange={e => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-white/10 rounded-xl text-xs text-white focus:border-primary-orange focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingRestaurant(null);
                      }}
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? 'Salvando...' : (isCreating ? 'Criar Restaurante' : 'Salvar Alterações')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restaurants Grid List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-orange" />
              Restaurantes Cadastrados ({filteredRestaurants.length})
            </h2>
          </div>

          {loading ? (
            <div className="bg-surface-container-low p-12 rounded-2xl border border-white/5 text-center">
              <div className="w-8 h-8 border-2 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-on-surface-variant">Carregando tenants no Firestore...</p>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-surface-container-low p-12 rounded-2xl border border-white/5 text-center space-y-3">
              <Store className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <p className="text-sm font-bold text-white">Nenhum estabelecimento encontrado</p>
              <p className="text-xs text-on-surface-variant">
                Tente ajustar os filtros ou cadastre um novo restaurante parceiro.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-primary-orange text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
              >
                Cadastrar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRestaurants.map(rest => {
                const isActive = rest.status === 'active';
                return (
                  <div
                    key={rest.id}
                    className="bg-surface-container-low p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between shadow-md"
                  >
                    <div>
                      {/* Card Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={rest.logoUrl}
                            alt={rest.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-black/40 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-extrabold text-white leading-tight">{rest.name}</h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-primary-orange font-mono">
                              <span>/cardapio/{rest.slug}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-surface-container-high text-on-surface border border-white/5 shrink-0">
                          {rest.plan}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                          <span className="truncate">WA: {rest.whatsapp}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                          <span className="truncate">{rest.city} - {rest.state}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                          <span className="truncate">{rest.openingTime} às {rest.closingTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate text-emerald-400">Firebase Auth (RBAC)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (onViewPublicMenu) onViewPublicMenu(rest.slug);
                            else {
                              setActiveSlug(rest.slug);
                              window.open(`/cardapio/${rest.slug}`, '_blank');
                            }
                          }}
                          className="p-2 bg-surface-container-high hover:bg-white/10 rounded-xl text-on-surface-variant hover:text-white transition-colors"
                          title="Abrir Cardápio Público"
                        >
                          <ExternalLink className="w-4 h-4 text-primary-orange" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rest)}
                          className="p-2 bg-surface-container-high hover:bg-white/10 rounded-xl text-on-surface-variant hover:text-white transition-colors"
                          title="Editar Cadastro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(rest)}
                          className={`p-2 rounded-xl transition-colors ${
                            isActive ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={isActive ? 'Desativar' : 'Ativar'}
                        >
                          {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(rest)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (onEnterRestaurantAdmin) onEnterRestaurantAdmin(rest);
                          else if (onSelectRestaurant) onSelectRestaurant(rest);
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-primary-orange to-primary-accent text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-orange/20 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Layers className="w-4 h-4" /> Gerenciar Painel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
