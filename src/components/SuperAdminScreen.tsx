import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SuperAdminScreen() {
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRestaurantName(data.restaurantName || '');
          setAddress(data.address || '');
          setOpeningHours(data.openingHours || '');
          setLogoUrl(data.logoUrl || '');
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const storageRef = ref(storage, `logos/restaurant_logo_${Date.now()}_${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        finalLogoUrl = await getDownloadURL(storageRef);
        setLogoUrl(finalLogoUrl);
        setLogoFile(null);
      }

      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, {
        restaurantName,
        address,
        openingHours,
        logoUrl: finalLogoUrl,
        updatedAt: new Date()
      }, { merge: true });

      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white text-center">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Painel Super Admin</h1>
      
      <form onSubmit={handleSaveSettings} className="bg-slate-800 p-6 rounded-xl space-y-6 shadow-lg border border-slate-700">
        
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Estabelecimento</label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Endereço (Novo campo adicionado) */}
        <div>
          <label className="block text-sm font-medium mb-2">Endereço</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua Exemplo, 123"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Horário de Funcionamento (Novo campo adicionado) */}
        <div>
          <label className="block text-sm font-medium mb-2">Horário de Funcionamento</label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Ex: Seg a Sex das 18h às 23h"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium mb-2">Logo</label>
          {logoUrl && (
            <div className="mb-3">
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setLogoFile(e.target.files[0]);
              }
            }}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition duration-200 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>

      </form>
    </div>
  );
}
