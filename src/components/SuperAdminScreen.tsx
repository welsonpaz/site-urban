import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Settings, Tag, Palette, Store, Lock, LogIn } from 'lucide-react';
import { auth, loginWithEmail, logoutUser } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface SuperAdminScreenProps {
  onBack: () => void;
}

export default function SuperAdminScreen({ onBack }: SuperAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'coupons' | 'branding'>('config');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Estados para o formulário de login caso não esteja autenticado
  const [emailInput, setEmailInput] = useState('gerente@restaurante.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const ALLOWED_ADMIN_EMAIL = 'gerente@restaurante.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await loginWithEmail(emailInput, passwordInput);
    } catch (error: any) {
      setAuthError('Credenciais inválidas no Firebase Auth.');
    }
  };

  if (loadingAuth) {
    return <div className="p-8 text-center text-gray-400">Verificando credenciais de acesso...</div>;
  }

  // 1. Se não estiver logado, exibe a tela de login exclusiva do Super Admin
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={onBack}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Lock className="w-8 h-8 text-indigo-400 mx-auto" />
          <div className="w-9" /> {/* Espaçador para centralizar o ícone */}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Painel Super Admin</h2>
          <p className="text-xs text-gray-400">Identifique-se com a conta de gerência para continuar.</p>
        </div>

        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">E-mail de Gestão</label>
            <input 
              type="email" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Senha</label>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <LogIn className="w-4 h-4" /> Acessar Super Admin
          </button>
        </form>
      </div>
    );
  }

  // 2. Se estiver logado, mas o e-mail não for o autorizado, bloqueia o acesso
  if (currentUser.email !== ALLOWED_ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-center text-gray-100 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-sm text-gray-400">
          A conta <span className="text-indigo-400">{currentUser.email}</span> não tem permissão de Super Admin.
        </p>
        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => logoutUser()}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Trocar Conta
          </button>
          <button 
            onClick={onBack}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // 3. Painel Completo de Super Admin (Autenticado e Autorizado) com as cores corretas do cardápio
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-colors text-gray-300"
            title="Voltar ao Início"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" /> Painel Super Admin
            </h1>
            <p className="text-sm text-gray-400">Logado como: <span className="text-indigo-400">{currentUser.email}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Abas de Navegação Interna */}
          <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800">
            <button 
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Store className="w-4 h-4" /> Geral
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Tag className="w-4 h-4" /> Cupons
            </button>
            <button 
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'branding' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Palette className="w-4 h-4" /> Aparência
            </button>
          </div>

          <button 
            onClick={() => logoutUser()}
            className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        {activeTab === 'config' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Configurações Gerais da Plataforma</h2>
            <p className="text-sm text-gray-400">Controle o status de abertura e os parâmetros de funcionamento.</p>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Gerenciamento de Cupons de Desconto</h2>
            <p className="text-sm text-gray-400">Adicione e remova cupons ativos para os clientes.</p>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Identidade Visual</h2>
            <p className="text-sm text-gray-400">Altere o logotipo e o nome do estabelecimento exibidos no topo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
