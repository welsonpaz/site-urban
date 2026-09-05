import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Mail, MapPin, Tag, Smartphone, Shield, LogOut, Heart, ChevronRight, Database, Check, Lock, UserPlus } from 'lucide-react';
import { ScreenType, Restaurant, UserAddress } from '../types';
import { useLogo, useBranding } from '../lib/logoState';
import { useCoupons } from '../lib/couponState';
import { auth } from '../lib/firebase';
import { getCustomerAuthProfile, loginCustomer, registerCustomer, logoutUser, CustomerAuthProfile } from '../lib/authService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface ProfileScreenProps {
  onBack: () => void;
  onChangeScreen: (screen: ScreenType) => void;
  onOpenSuperAdmin?: () => void;
  activeRestaurant?: Restaurant | null;
  customerName?: string;
  customerPhone?: string;
  setCustomerName?: (name: string) => void;
  setCustomerPhone?: (phone: string) => void;
  address?: UserAddress;
  setAddress?: (address: UserAddress) => void;
}

export default function ProfileScreen({ onBack, onChangeScreen, onOpenSuperAdmin, activeRestaurant, customerName = '', customerPhone = '', setCustomerName, setCustomerPhone, address, setAddress }: ProfileScreenProps) {
  const defaultLogo = useLogo();
  const defaultBranding = useBranding();
  const logo = activeRestaurant?.logoUrl || defaultLogo;
  const branding = activeRestaurant ? { name: activeRestaurant.name, subtitle: activeRestaurant.subtitle || '', tag: activeRestaurant.tag || '' } : defaultBranding;
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { coupons } = useCoupons();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [profile, setProfile] = useState<CustomerAuthProfile | null>(null);
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register'>('choice');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2500); };
  const normalizePhone = (v: string) => v.replace(/\D/g, '');
  const formatPhone = (v: string) => { const c = normalizePhone(v); if (c.length <= 2) return c; if (c.length <= 6) return `(${c.slice(0,2)}) ${c.slice(2)}`; if (c.length <= 10) return `(${c.slice(0,2)}) ${c.slice(2,6)}-${c.slice(6)}`; return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`; };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) { setProfile(null); return; }
      try {
        const p = await getCustomerAuthProfile(user.uid);
        setProfile(p);
        if (p) {
          setName(p.name || ''); setPhone(p.phone || ''); setEmail(p.email || user.email || '');
          setCustomerName?.(p.name || ''); setCustomerPhone?.(p.phone || '');
          if (setAddress) setAddress({ street: p.street || '', details: p.details || '', neighborhood: p.neighborhood || '', cityState: p.cityState || '', cep: p.cep || '' });
        }
      } catch (e) { console.error('Erro ao carregar perfil do cliente:', e); }
    });
    return unsub;
  }, [setCustomerName, setCustomerPhone, setAddress]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(''); setLoadingAuth(true);
    try { const result = await loginCustomer(email, password); if (result.profile) showToast('Login realizado! Seus dados foram carregados.'); else showToast('Login realizado. Complete seu perfil.'); setAuthMode('choice'); }
    catch (err: any) { setAuthError(getFirebaseError(err)); }
    finally { setLoadingAuth(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError('');
    if (password.length < 6) { setAuthError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setAuthError('As senhas não conferem.'); return; }
    if (normalizePhone(phone).length < 10) { setAuthError('Informe um telefone válido com DDD.'); return; }
    setLoadingAuth(true);
    try {
      const p = await registerCustomer(email, password, { name, phone: normalizePhone(phone), cep: address?.cep || '', street: address?.street || '', details: address?.details || '', neighborhood: address?.neighborhood || '', cityState: address?.cityState || '' });
      setProfile(p); setAuthMode('choice'); setCustomerName?.(p.name); setCustomerPhone?.(p.phone); showToast('Cadastro realizado e salvo no Firebase!');
    } catch (err: any) { setAuthError(getFirebaseError(err)); }
    finally { setLoadingAuth(false); }
  };

  const handleLogout = async () => { try { await logoutUser(); setProfile(null); showToast('Você saiu da sua conta.'); } catch { showToast('Não foi possível sair agora.'); } };
  const handleCopyCoupon = (code: string) => { navigator.clipboard?.writeText(code); showToast(`Cupom "${code}" copiado!`); };

  const displayName = profile?.name || firebaseUser?.displayName || customerName || 'Cliente';
  const displayEmail = profile?.email || firebaseUser?.email || 'E-mail não informado';
  const displayPhone = profile?.phone || customerPhone;
  const displayAddress = profile?.street ? `${profile.street}${profile.details ? ` - ${profile.details}` : ''}` : address?.street || 'Nenhum endereço cadastrado';
  const displayCity = profile?.neighborhood ? `${profile.neighborhood}${profile.cityState ? `, ${profile.cityState}` : ''}` : address?.neighborhood ? `${address.neighborhood}${address.cityState ? `, ${address.cityState}` : ''}` : '';

  return (
    <div className="bg-dark-bg min-h-screen text-on-surface font-sans pb-32">
      <header className="fixed top-0 w-full z-50 bg-dark-bg/95 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-5 justify-between max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl left-1/2 -translate-x-1/2 md:rounded-t-[2.5rem] shadow-sm">
        <div className="flex items-center"><button onClick={onBack} className="text-primary-orange p-1 hover:bg-white/5 rounded-full mr-3" title="Voltar"><ArrowLeft className="w-6 h-6" /></button><h1 className="font-extrabold text-base text-white">Meu Perfil</h1></div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChangeScreen('menu')}><img alt="Logo" className="h-9 w-9 object-cover rounded-full bg-black border border-white/10" src={logo} /><div className="flex flex-col text-left"><span className="text-xs font-black text-white">{branding.name}</span><span className="text-[7px] font-extrabold text-primary-orange uppercase">Artesanal</span></div></div>
      </header>

      <main className="pt-20 px-5 max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
        {!firebaseUser ? (
          <section className="bg-surface-container-low p-5 rounded-2xl border border-primary-orange/20 mt-4">
            <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange"><User className="w-6 h-6" /></div><div><h2 className="text-base font-extrabold text-white">Acesse seu perfil</h2><p className="text-xs text-on-surface-variant">Cadastre-se ou entre para salvar seus dados e pedidos.</p></div></div>
            {authMode === 'choice' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onClick={() => setAuthMode('login')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-orange text-white font-bold text-sm"><Lock className="w-4 h-4" /> Entrar</button><button onClick={() => setAuthMode('register')} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm"><UserPlus className="w-4 h-4" /> Criar cadastro</button></div>}
            {authMode === 'login' && <form onSubmit={handleLogin} className="space-y-3"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Seu e-mail" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/>{authError&&<p className="text-xs text-red-400">{authError}</p>}<button disabled={loadingAuth} className="w-full py-3 rounded-xl bg-primary-orange text-white font-bold">{loadingAuth?'Entrando...':'Entrar no meu perfil'}</button><button type="button" onClick={()=>{setAuthMode('choice');setAuthError('')}} className="w-full text-xs text-on-surface-variant py-2">Voltar</button></form>}
            {authMode === 'register' && <form onSubmit={handleRegister} className="space-y-3"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/><input required value={phone} onChange={e=>setPhone(formatPhone(e.target.value))} placeholder="Telefone com DDD" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha (mínimo 6 caracteres)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/><input required type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirme a senha" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"/>{authError&&<p className="text-xs text-red-400">{authError}</p>}<button disabled={loadingAuth} className="w-full py-3 rounded-xl bg-primary-orange text-white font-bold">{loadingAuth?'Criando cadastro...':'Criar minha conta'}</button><button type="button" onClick={()=>{setAuthMode('choice');setAuthError('')}} className="w-full text-xs text-on-surface-variant py-2">Voltar</button></form>}
          </section>
        ) : (
          <section className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4 mt-4"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange border border-primary-orange/20"><User className="w-7 h-7" /></div><div><h2 className="text-base font-extrabold text-white">{displayName}</h2><div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5"><Mail className="w-3.5 h-3.5 text-primary-accent"/><span>{displayEmail}</span></div>{displayPhone&&<div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1"><Smartphone className="w-3.5 h-3.5 text-primary-accent"/><span>{formatPhone(displayPhone)}</span></div>}</div></div><button onClick={handleLogout} className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-3 py-2 rounded-xl font-bold"><LogOut className="w-4 h-4 inline mr-1"/> Sair</button></section>
        )}

        {firebaseUser && <>
          <section className="space-y-4"><h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-orange"/> Endereço</h3><div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5"><p className="font-extrabold text-white text-xs">Endereço salvo no Firebase</p><p className="text-xs text-on-surface-variant mt-1">{displayAddress}</p>{displayCity&&<p className="text-xs text-on-surface-variant">{displayCity}</p>}</div></section>
          <section className="space-y-3"><h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2"><Tag className="w-4 h-4 text-primary-orange"/> Cupons Disponíveis</h3><div className="space-y-3">{coupons.length===0?<div className="bg-surface-container-low/50 p-4 rounded-xl border border-white/5 text-center"><p className="text-xs text-on-surface-variant/70 italic">Nenhum cupom disponível no momento.</p></div>:coupons.map(c=><div key={c.id||c.code} onClick={()=>handleCopyCoupon(c.code)} className="bg-surface-container-low/70 p-3 rounded-xl border border-dashed border-white/10 flex justify-between items-center cursor-pointer"><div><span className="inline-block text-xs font-mono font-black text-primary-orange bg-primary-orange/10 px-2 py-0.5 rounded">{c.code}</span><p className="text-[11px] text-on-surface-variant mt-1">{c.description || (c.type==='percent'?`${c.discount}% de desconto`:`R$ ${c.discount.toFixed(2).replace('.',',')} de desconto`)}</p></div><span className="text-[10px] text-primary-accent font-bold uppercase">Toque para Copiar</span></div>)}</div></section>
        </>}

        <section className="bg-surface-container-low p-4 rounded-2xl border border-white/5 space-y-1 text-sm font-semibold text-white">
          <div onClick={() => onChangeScreen('dashboard')} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer text-primary-orange"><span className="flex items-center gap-3 font-bold"><Database className="w-4 h-4"/> Painel do Restaurante ({activeRestaurant?.name || 'Administrativo'}) <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">RESTRITO</span></span><ChevronRight className="w-4 h-4"/></div>
          {onOpenSuperAdmin && <div onClick={onOpenSuperAdmin} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer text-primary-accent"><span className="flex items-center gap-3 font-bold"><Shield className="w-4 h-4"/> Super Admin WP Integrada (Multi-Tenant)</span><ChevronRight className="w-4 h-4"/></div>}
          <div onClick={()=>onChangeScreen('favorites')} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer"><span className="flex items-center gap-3"><Heart className="w-4 h-4 text-primary-orange"/> Meus Pratos Favoritos</span><ChevronRight className="w-4 h-4"/></div>
          <div onClick={()=>onChangeScreen('orders')} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer"><span className="flex items-center gap-3"><Smartphone className="w-4 h-4 text-primary-orange"/> Acompanhar Histórico de Pedidos</span><ChevronRight className="w-4 h-4"/></div>
          <div onClick={()=>showToast('Políticas de Privacidade atualizadas em 2026!')} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/5 rounded-xl cursor-pointer"><span className="flex items-center gap-3"><Shield className="w-4 h-4 text-primary-orange"/> Termos & Privacidade</span><ChevronRight className="w-4 h-4"/></div>
        </section>
      </main>
      <AnimatePresence>{toastMsg&&<motion.div initial={{opacity:0,y:50,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:20,x:'-50%'}} className="fixed bottom-24 left-1/2 z-50 bg-surface-container-high border border-primary-orange/30 text-white text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 max-w-xs text-center"><Check className="w-4 h-4 text-primary-orange"/><span className="font-bold">{toastMsg}</span></motion.div>}</AnimatePresence>
    </div>
  );
}

function getFirebaseError(error: any): string {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Este e-mail já possui uma conta. Faça login.';
    case 'auth/invalid-email': return 'Informe um e-mail válido.';
    case 'auth/weak-password': return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    default: return error?.message || 'Não foi possível concluir a operação.';
  }
}
