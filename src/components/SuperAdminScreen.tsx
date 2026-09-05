import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, Settings, Tag, Palette, Store } from 'lucide-react';
import { useAuth } from '../lib/authService'; // ou seu hook de autenticação ativo

interface SuperAdminScreenProps {
  onBack: () => void;
}

export default function SuperAdminScreen({ onBack }: SuperAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'coupons' | 'branding'>('config');
  
  // Exemplo de verificação do e-mail do usuário logado
  // (Caso utilize o Firebase Auth diretamente, adapte para pegar o user.email atual)
  const userEmail = "gerente@restaurante.com"; // Simulação ou integração com o Auth real
  const allowedSuperAdminEmail = "gerente@restaurante.com";

  // Restrição de Acesso ao Super Admin
  if (userEmail !== allowedSuperAdminEmail) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-gray-100">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
          <p className="text-sm text-gray-400">
            Sua conta não possui permissão de Super Administrador para acessar este painel global.
          </p>
          <button 
            onClick={onBack}
            className="mt-4 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-100">
      {/* Cabeçalho com Botão de Voltar e Identidade Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-colors text-gray-300"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" /> Painel Super Admin
            </h1>
            <p className="text-sm text-gray-400">Gerenciamento global de configurações e parâmetros do sistema</p>
          </div>
        </div>

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
      </div>

      {/* Conteúdo das Abas com Cores Alinhadas ao Cardápio */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        {activeTab === 'config' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Configurações Gerais da Plataforma</h2>
            <p className="text-sm text-gray-400">Gerencie o status de funcionamento da loja e parâmetros globais.</p>
            {/* Adicione os controles gerais aqui */}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Gerenciamento de Cupons Globais</h2>
            <p className="text-sm text-gray-400">Crie cupons de desconto aplicáveis para os clientes do cardápio.</p>
            {/* Adicione a listagem e criação de cupons aqui */}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Identidade Visual e Logo</h2>
            <p className="text-sm text-gray-400">Atualize o logotipo e o título exibidos no topo do site.</p>
            {/* Adicione os uploads de logo e títulos aqui */}
          </div>
        )}
      </div>
    </div>
  );
}
