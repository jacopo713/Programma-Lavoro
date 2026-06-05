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

export async function resolvePhotoAsDataUrl(src: string): Promise<string> {
  if (isDataUrlPhoto(src)) return src;
  if (!isRemotePhoto(src)) return src;

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Impossibile scaricare l'immagine");
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
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
        return { ...item, photos: [dataUrl] };
      } catch {
        return item;
      }
    }),
  );
}
