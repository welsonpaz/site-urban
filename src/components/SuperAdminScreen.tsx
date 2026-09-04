import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function SuperAdminScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
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
          alert("Acesso negado: seu perfil não tem permissão de Super Admin.");
          if (onNavigate) onNavigate('dashboard');
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

  // Cole aqui todo o JSX original que renderiza o painel Super Admin a partir daqui:
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* Mantenha o JSX original do seu componente aqui sem deixar a tag vazia */}
    </div>
  );
}
export default SuperAdminScreen;
