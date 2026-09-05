export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Limite de tamanho de imagem: 1.5MB para não sobrecarregar o Firestore
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
