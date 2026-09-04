import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface SuperAdminScreenProps {
  onNavigate?: (screen: string) => void;
}

interface RestaurantConfig {
  name: string;
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  slogan: string;
}

// Utilitário interno para conversão de arquivo em Base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 1.5 * 1024 * 1024) {
      reject(new Error("A imagem deve ter no máximo 1.5MB."));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Componente Reutilizável de Upload de Imagem (Logo / Produtos)
function ImageUploader({
  currentImage,
  onImageSelected,
  label = "Foto / Logo"
}: {
  currentImage: string;
  onImageSelected: (base64: string) => void;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await convertFileToBase64(file);
      onImageSelected(base64);
    } catch (err: any) {
      alert(err.message || "Erro ao processar imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
          {currentImage ? (
            <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-zinc-500">Sem foto</span>
          )}
        </div>
        <label className="cursor-pointer py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-2">
          {loading ? "Processando..." : "📷 Alterar Imagem"}
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}

export function SuperAdminScreen({ onNavigate }: SuperAdminScreenProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados de Login Interno
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Estado da Configuração de Branding da Loja
  const [config, setConfig] = useState<RestaurantConfig>({
    name: 'Urbano Burguer',
    logoUrl: '',
    primaryColor: '#f97316',
    backgroundColor: '#09090b',
    textColor: '#ffffff',
    slogan: 'O Verdadeiro Sabor do Fogo'
  });

  const checkPermissionsAndLoad = async (currentUser: typeof auth.currentUser) => {
    if (!currentUser) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'super_admin') {
        setIsAuthorized(true);

        // Carrega as configurações visuais do cardápio do Firestore
        const settingsDoc = await getDoc(doc(db, 'settings', 'branding'));
        if (settingsDoc.exists()) {
          setConfig(settingsDoc.data() as RestaurantConfig);
        }
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
        checkPermissionsAndLoad(loggedUser);
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
      await checkPermissionsAndLoad(userCredential.user);
    } catch (error: any) {
      console.error("Erro no login:", error);
      setLoginError("E-mail ou senha incorretos.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'branding'), config, { merge: true });
      alert("Configurações e imagens salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

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
        <p className="text-sm text-zinc-400">Verificando credenciais...</p>
      </div>
    );
  }

  // 1. TELA DE LOGIN PARA NÃO AUTENTICADOS
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

  // 2. TELA DE BLOQUEIO PARA USUÁRIOS SEM ROLE SUPER_ADMIN
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

  // 3. PAINEL SUPER ADMIN COMPLETO COM UPLOAD DE IMAGENS E BRANDING
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form de Configurações */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-zinc-800 pb-3">Identidade Visual & Marca</h2>

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

          {/* Componente de Upload de Imagem */}
          <ImageUploader
            label="Logomarca da Loja (PNG / JPG)"
            currentImage={config.logoUrl}
            onImageSelected={(base64) => setConfig({ ...config, logoUrl: base64 })}
          />

          {/* Cores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Cor Primária</label>
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

          <div className="flex gap-4 pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveBranding}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
            >
              {saving ? 'Salvando...' : 'Salvar Branding e Imagens'}
            </button>
            <button
              onClick={handleResetDefault}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm transition-colors"
            >
              Redefinir Padrão
            </button>
          </div>
        </div>

        {/* Pré-visualização ao Vivo */}
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
                Botão Exemplo
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-6 text-center">
            Uploads de imagens e edições são convertidos em tempo real para armazenamento seguro no Firestore.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminScreen;
