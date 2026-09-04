import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface SuperAdminScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SuperAdminScreen({ onNavigate }: SuperAdminScreenProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Estados do formulário de login interno
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Função para verificar se a role é super_admin
  const checkPermissions = async (currentUser: typeof auth.currentUser) => {
    if (!currentUser) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'super_admin') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((loggedUser) => {
      setUser(loggedUser);
      if (loggedUser) {
        checkPermissions(loggedUser);
      } else {
        setIsAuthorized(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkPermissions(userCredential.user);
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      setLoginError("E-mail ou senha incorretos.");
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Verificando credenciais...</p>
      </div>
    );
  }

  // 1. SE NÃO ESTIVER LOGADO -> Exibe a Tela de Login de Super Admin
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">WP Integrada</h2>
            <p className="text-xs text-zinc-400">Login exclusivo para Super Administradores</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@wpintegrada.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
            >
              {loggingIn ? 'Autenticando...' : 'Entrar no Painel Global'}
            </button>
          </form>

          <button
            onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Voltar para o Painel da Loja
          </button>
        </div>
      </div>
    );
  }

  // 2. SE ESTIVER LOGADO MAS NÃO FOR SUPER ADMIN -> Exibe Acesso Restrito
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✕
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-500">Acesso Restrito</h2>
            <p className="text-sm text-zinc-400 mt-1">
              A conta logada ({user.email}) não possui privilégios de Super Admin.
            </p>
          </div>
          
          <div className="space-y-2 pt-2">
            <button
              onClick={() => auth.signOut()}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Sair desta conta para trocar de login
            </button>
            <button
              onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
            >
              ← Voltar ao Painel da Loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. SE ESTIVER LOGADO E FOR SUPER ADMIN -> Exibe o Painel Completo
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">WP Integrada • Painel Super Admin</h1>
          <p className="text-xs text-zinc-400">
            Autenticado como: <span className="text-orange-400">{user.email}</span> (Super Admin)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg text-zinc-300 transition-colors"
          >
            Ir para Painel da Loja
          </button>
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <p className="text-xs text-zinc-400">Total Cadastrados</p>
          <p className="text-2xl font-bold text-white mt-1">1</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <p className="text-xs text-zinc-400">Ativos no Ar</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">1</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <p className="text-xs text-zinc-400">Pausados / Inativos</p>
          <p className="text-2xl font-bold text-zinc-500 mt-1">0</p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminScreen;
