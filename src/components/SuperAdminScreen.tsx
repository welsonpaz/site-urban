import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Tag, Palette, Store, Lock, LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface SuperAdminScreenProps {
  onBack: () => void;
}

export default function SuperAdminScreen({ onBack }: SuperAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'coupons' | 'branding'>('config');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

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
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (error: any) {
      setAuthError('E-mail ou senha incorretos no Firebase Auth.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  if (loadingAuth) {
    return <div className="p-8 text-center text-gray-400">Verificando credenciais...</div>;
  }

  // Se não estiver logado, exibe a tela de login integrada com o Firebase Auth
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
          <div className="w-9" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Painel Super Admin</h2>
          <p className="text-xs text-gray-400">Autentique-se com uma conta cadastrada no Firebase.</p>
        </div>

        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">E-mail</label>
            <input 
              type="email" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="ex: welsonpaz@gmail.com"
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
            <LogIn className="w-4 h-4" /> Entrar no Painel
          </button>
        </form>
      </div>
    );
  }

  // Painel Completo (Liberado para qualquer usuário autenticado no Firebase)
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
            <p className="text-sm text-gray-400">Conectado via Firebase Auth como: <span className="text-indigo-400">{currentUser.email}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={handleLogout}
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
            <p className="text-sm text-gray-400">Controle os parâmetros globais e o status do sistema.</p>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Gerenciamento de Cupons de Desconto</h2>
            <p className="text-sm text-gray-400">Adicione e remova cupons ativos.</p>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Identidade Visual e Logo</h2>
            <p className="text-sm text-gray-400">Atualize o logotipo e o título do estabelecimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
