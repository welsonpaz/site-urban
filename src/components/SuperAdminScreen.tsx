import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SuperAdminScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SuperAdminScreen({ onNavigate }: SuperAdminScreenProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function verifyAccess() {
      const user = auth.currentUser;

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists() && userDoc.data().role === 'super_admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissão de Super Admin:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    verifyAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Verificando credenciais no Firebase...</p>
      </div>
    );
  }

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
              Sua conta não possui privilégios de Super Admin para acessar a plataforma WP Integrada.
            </p>
          </div>
          <button
            onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
          >
            ← Voltar ao Painel da Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* Cabeçalho do Super Admin */}
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">WP Integrada • Painel Super Admin</h1>
          <p className="text-xs text-zinc-400">
            Autenticado como: <span className="text-orange-400">{auth.currentUser?.email}</span> (Super Admin)
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg text-zinc-300 transition-colors"
        >
          Ir para Painel do Restaurante
        </button>
      </div>

      {/* Conteúdo Principal do Painel */}
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
