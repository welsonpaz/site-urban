import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Dentro do seu componente SuperAdminScreen:
export function SuperAdminScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function verifyAccess() {
      const user = auth.currentUser;

      // Se não estiver logado, redireciona para login
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        // Busca o papel do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists() && userDoc.data().role === 'super_admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          // Opcional: lança um alerta informando a restrição
          alert("Acesso negado: seu perfil não tem permissão de Super Admin.");
          if (onNavigate) onNavigate('dashboard'); // Redireciona para o painel do gerente
        }
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    verifyAccess();
  }, [onNavigate]);

  if (loading) {
    return <div className="p-8 text-center text-white">Verificando permissões...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <h2 className="text-xl font-bold text-red-500">Acesso Restrito</h2>
        <p className="mt-2 text-gray-400">Esta área é exclusiva para Super Administradores do sistema.</p>
      </div>
    );
  }

  // Conteúdo normal da tela do Super Admin entra aqui...
  return (
    // ... resto do seu código JSX existente do SuperAdminScreen
  );
}
