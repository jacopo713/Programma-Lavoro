import { isDataUrlPhoto, isRemotePhoto } from "@/lib/criticismDisplay";
import type { Criticism } from "@/lib/types";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Lettura immagine fallita"));
    };
    reader.onerror = () => reject(new Error("Lettura immagine fallita"));
    reader.readAsDataURL(blob);
  });
}

function photoProxyUrl(src: string): string {
  return `/api/photo-proxy?url=${encodeURIComponent(src)}`;
}

async function fetchRemotePhotoAsDataUrl(src: string): Promise<string> {
  const isFirebase = src.includes("firebasestorage.googleapis.com");
  const fetchUrl = isFirebase ? photoProxyUrl(src) : src;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Impossibile scaricare l'immagine (${response.status})`);
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
}

export async function resolvePhotoAsDataUrl(src: string): Promise<string> {
  if (isDataUrlPhoto(src)) return src;
  if (!isRemotePhoto(src)) return src;
  return fetchRemotePhotoAsDataUrl(src);
}

export async function resolveCriticismsForPdf(
  items: Criticism[],
): Promise<Criticism[]> {
  return Promise.all(
    items.map(async (item) => {
      const photo = item.photos[0];
      if (!photo || isDataUrlPhoto(photo)) return item;

      try {
        const dataUrl = await resolvePhotoAsDataUrl(photo);
        if (!isDataUrlPhoto(dataUrl)) {
          throw new Error("Conversione immagine non ha prodotto un data URL");
        }
        return { ...item, photos: [dataUrl] };
      } catch (error) {
        console.warn(
          `PDF: impossibile risolvere foto criticità ${item.id}:`,
          error,
        );
        return { ...item, photos: [] };
      }
    }),
  );
}
