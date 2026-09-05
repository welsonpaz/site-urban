import React, { useState, useEffect } from 'react';
import { auth, signInWithEmail } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SuperAdminScreen from './components/SuperAdminScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    
    const result = await signInWithEmail(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    } else {
      setLoginError(result.error || 'E-mail ou senha incorretos.');
    }
    setLoggingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando sistema...
      </div>
    );
  }

  // Se não estiver logado, exibe a tela de login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-white">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Painel Super Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-sm rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition duration-200 disabled:opacity-50 mt-2"
            >
              {loggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Se estiver logado, exibe o painel do Super Admin com o botão de Sair
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="text-sm text-slate-400">
          Logado como: <span className="text-white font-medium">{user.email}</span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
        >
          Sair
        </button>
      </header>

      <main>
        <SuperAdminScreen />
      </main>
    </div>
  );
}
