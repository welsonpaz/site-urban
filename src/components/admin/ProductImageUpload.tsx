import React, { useState } from 'react';

interface ProductImageUploadProps {
  currentImage: string;
  onImageChange: (base64: string) => void;
}

// Conversão segura para Base64 com trava de 1.5MB
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 1.5 * 1024 * 1024) {
      reject(new Error("A imagem do produto deve ter no máximo 1.5MB."));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function ProductImageUpload({ currentImage, onImageChange }: ProductImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await convertFileToBase64(file);
      onImageChange(base64);
    } catch (err: any) {
      alert(err.message || "Erro ao carregar a imagem do produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-400">Foto do Prato / Lanche</label>
      
      <div className="flex items-center gap-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
        <div className="w-20 h-20 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
          {currentImage ? (
            <img src={currentImage} alt="Produto" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-zinc-500 text-center px-1">Sem Foto</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="cursor-pointer inline-flex items-center gap-2 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">
            {loading ? "Carregando..." : "📷 Enviar Foto do Produto"}
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          
          {currentImage && (
            <button
              type="button"
              onClick={() => onImageChange('')}
              className="block text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remover imagem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductImageUpload;
