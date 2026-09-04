import React, { useState } from 'react';
import DashboardScreen from './components/DashboardScreen';
import SuperAdminScreen from './components/SuperAdminScreen';

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Barra Superior de Navegação entre os Painéis */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-indigo-400">Urban Platform</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentView('store')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'store' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Painel da Loja (Dashboard)
          </button>
          <button 
            onClick={() => setCurrentView('admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Super Admin
          </button>
        </div>
      </header>

      {/* Conteúdo Dinâmico Baseado na Escolha */}
      <main className="flex-1">
        {currentView === 'store' ? <DashboardScreen /> : <SuperAdminScreen />}
      </main>
    </div>
  );
}
