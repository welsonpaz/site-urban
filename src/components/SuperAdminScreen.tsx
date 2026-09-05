import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function SuperAdminScreen() {
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
        console.log('Iniciando upload da imagem...');
        const storageRef = ref(storage, `logos/restaurant_logo_${Date.now()}_${logoFile.name}`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        console.log('Upload concluído com sucesso!', snapshot);
        
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
      console.error('Erro detalhado no upload/salvamento:', error);
      alert(`Falha ao enviar imagem ou salvar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white text-center">Carregando configurações...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Painel Super Admin - Configurações do Sistema</h1>
      
      <form onSubmit={handleSaveSettings} className="bg-slate-800 p-6 rounded-xl space-y-6 shadow-lg border border-slate-700">
        
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Estabelecimento</label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="Ex: Urban Burguer"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Endereço Completo</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Av. Dom Severino, 1234 - Teresina/PI"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Horário de Funcionamento</label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Ex: Terça a Domingo das 18:00 às 23:30"
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Logotipo do Estabelecimento</label>
          {logoUrl && (
            <div className="mb-3">
              <img src={logoUrl} alt="Logo atual" className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
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
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition duration-200 disabled:opacity-50"
        >
          {saving ? 'Salvando alterações...' : 'Salvar Alterações'}
        </button>

      </form>
    </div>
  );
}
