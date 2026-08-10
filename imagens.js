const IMGBB_API_KEY = "fea0d5a6e89bea697d1fb6c08b030690";

export function comprimirImagem(file, maxDimension = 1000, quality = 0.7) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);

    const timer = setTimeout(() => resolve(file), 4000);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const escala = Math.min(1, maxDimension / width, maxDimension / height);
          width = Math.max(1, Math.round(width * escala));
          height = Math.max(1, Math.round(height * escala));

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            clearTimeout(timer);
            if (!blob) return resolve(file);
            const nomeSemExtensao = file.name ? file.name.replace(/\.[^/.]+$/, "") : "foto";
            resolve(new File([blob], `${nomeSemExtensao}.jpg`, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        } catch (err) {
          clearTimeout(timer);
          resolve(file);
        }
      };

      img.onerror = () => { clearTimeout(timer); resolve(file); };
      img.src = event.target.result;
    };

    reader.onerror = () => { clearTimeout(timer); resolve(file); };
    reader.readAsDataURL(file);
  });
}

export async function fazerUploadImagem(file) {
  if (!file) return null;
  try {
    const fotoOtimizada = await comprimirImagem(file);
    const formData = new FormData();
    formData.append("image", fotoOtimizada);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;
    try {
      response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (data && data.success) {
      return data.data.url;
    } else {
      console.warn("Erro na resposta do ImgBB:", data);
      return null;
    }
  } catch (error) {
    console.warn("Falha no upload de uma imagem para o ImgBB:", error);
    return null;
  }
}

export async function fazerUploadImagens(files) {
  if (!files || files.length === 0) return [];
  const listaArquivos = Array.from(files).slice(0, 10);
  const resultados = new Array(listaArquivos.length);
  let proximoIndice = 0;

  async function enviarProximo() {
    while (proximoIndice < listaArquivos.length) {
      const indice = proximoIndice++;
      resultados[indice] = await fazerUploadImagem(listaArquivos[indice]);
    }
  }

  const totalSimultaneo = Math.min(3, listaArquivos.length);
  await Promise.all(Array.from({ length: totalSimultaneo }, () => enviarProximo()));
  return resultados.filter(Boolean);
}
