const LOGO_PATH = "/app-logo.svg";

export const APP_LOGO_ASPECT = 1;

let cachedLogoDataUrl: string | null = null;

async function svgToPngDataUrl(svgUrl: string, sizePx: number): Promise<string> {
  const res = await fetch(svgUrl);
  if (!res.ok) {
    throw new Error(`Logo non trovato: ${svgUrl}`);
  }

  const svgText = await res.text();
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Impossibile rasterizzare il logo"));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas non disponibile");
    }
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function getAppLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  cachedLogoDataUrl = await svgToPngDataUrl(LOGO_PATH, 256);
  return cachedLogoDataUrl;
}

/** Per test o reset cache in dev */
export function clearAppLogoCache(): void {
  cachedLogoDataUrl = null;
}
