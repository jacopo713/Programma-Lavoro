/** Lato lungo massimo in pixel (riduce peso prima dell'upload) */
const MAX_EDGE_PX = 1280;
/** Qualità JPEG per archiviazione */
const JPEG_QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossibile leggere l'immagine"));
    img.src = src;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Ridimensiona e comprime un'immagine prima dell'upload su Firebase Storage.
 */
export async function compressImageFile(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = scaleDimensions(
      img.naturalWidth,
      img.naturalHeight,
      MAX_EDGE_PX,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non disponibile");
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (!dataUrl.startsWith("data:image/")) {
      throw new Error("Compressione fallita");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
