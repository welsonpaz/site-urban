import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface RestaurantConfig {
  name: string;
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  slogan: string;
}

export function SuperAdminScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado das configurações do Cardápio
  const [config, setConfig] = useState<RestaurantConfig>({
    name: 'Urbano Burguer',
    logoUrl: '',
    primaryColor: '#f97316', // Laranja padrão
    backgroundColor: '#09090b', // Zinc-950
    textColor: '#ffffff',
    slogan: 'O Verdadeiro Sabor do Fogo'
  });

  useEffect(() => {
    async function verifyAndLoad() {
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

          // Carrega as configurações globais do cardápio do Firestore
          const settingsDoc = await getDoc(doc(db, 'settings', 'branding'));
          if (settingsDoc.exists()) {
            setConfig(settingsDoc.data() as RestaurantConfig);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, []);

  // Salvar alterações no Firestore
  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'branding'), { ...config });
      alert("Configurações do cardápio salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  // Resetar para as cores padrão
  const handleResetDefault = () => {
    setConfig({
      name: 'Urbano Burguer',
      logoUrl: '',
      primaryColor: '#f97316',
      backgroundColor: '#09090b',
      textColor: '#ffffff',
      slogan: 'O Verdadeiro Sabor do Fogo'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Carregando painel de controle...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
          <h2 className="text-xl font-bold text-red-500">Acesso Restrito</h2>
          <p className="text-sm text-zinc-400">Esta área é exclusiva para Super Administradores.</p>
          <button
            onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm"
          >
            ← Voltar ao Painel da Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">WP Integrada • Gestão Total do Cardápio</h1>
          <p className="text-xs text-zinc-400">Edite branding, cores e identidade visual da loja em tempo real</p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg text-zinc-300 transition-colors"
        >
          Ir para Painel Operacional
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-zinc-800 pb-3">Identidade da Marca & Tema</h2>

          {/* Nome e Slogan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Estabelecimento</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slogan / Subtítulo</label>
              <input
                type="text"
                value={config.slogan}
                onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* URL da Logomarca */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">URL da Logomarca (PNG/JPG)</label>
            <input
              type="text"
              placeholder="https://exemplo.com/logo.png"
              value={config.logoUrl}
              onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Seleção de Cores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Cor Primária (Destaques)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-zinc-300 font-mono">{config.primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Cor de Fundo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-zinc-300 font-mono">{config.backgroundColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Cor dos Textos</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-zinc-300 font-mono">{config.textColor}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveBranding}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              onClick={handleResetDefault}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm transition-colors"
            >
              Redefinir Padrão
            </button>
          </div>
        </div>

        {/* Pré-visualização em Tempo Real */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Pré-visualização do Cardápio</h3>
            
            <div 
              className="p-6 rounded-xl border border-zinc-700 text-center space-y-3 transition-all"
              style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-16 h-16 rounded-full mx-auto object-cover border-2" style={{ borderColor: config.primaryColor }} />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-xl border-2" style={{ borderColor: config.primaryColor, color: config.primaryColor }}>
                  {config.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h4 className="text-xl font-bold">{config.name}</h4>
              <p className="text-xs opacity-75">{config.slogan}</p>
              
              <button 
                className="w-full py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 mt-4"
                style={{ backgroundColor: config.primaryColor }}
              >
                Botão Exemplo (Adicionar Pedido)
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-6 text-center">
            As edições salvas aqui são aplicadas instantaneamente para todos os visitantes do cardápio público.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminScreen;
