import React, { useState } from 'react';
import ProfileScreen from './components/ProfileScreen';
import DashboardScreen from './components/DashboardScreen';
import SuperAdminScreen from './components/SuperAdminScreen';
import Footer from './components/Footer';
import { useLogo, useBranding } from './lib/logoState';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'admin' | 'profile'>('home');
  const { logoUrl } = useLogo();
  const { siteTitle } = useBranding();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-between">
      {/* Barra de Navegação Superior */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
          ) : (
            <span className="font-bold text-xl text-indigo-400">{siteTitle || 'Urban'}</span>
          )}
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setCurrentView('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'home' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            Início
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('admin')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            Super Admin
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            Perfil
          </button>
        </nav>
      </header>

      {/* Corpo Principal da Aplicação */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div className="max-w-4xl mx-auto p-8 text-center space-y-6">
            <h1 className="text-4xl font-extrabold text-white">Bem-vindo ao {siteTitle || 'Urban'}</h1>
            <p className="text-gray-400">Sua plataforma multi-tenant integrada com React e Firebase.</p>
          </div>
        )}
        {currentView === 'dashboard' && <DashboardScreen />}
        {currentView === 'admin' && <SuperAdminScreen />}
        {currentView === 'profile' && <ProfileScreen />}
      </main>

      {/* Rodapé Padrão */}
      <Footer />
    </div>
  );
}
