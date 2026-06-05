const LOGO_PATH = "/sanatec-logo.png";

/** Aspect ratio originale 709×181 px */
export const SANATEC_LOGO_ASPECT = 181 / 709;

let cachedLogoDataUrl: string | null = null;

export async function getSanatecLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const res = await fetch(LOGO_PATH);
  if (!res.ok) {
    throw new Error(`Logo non trovato: ${LOGO_PATH}`);
  }

  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  cachedLogoDataUrl = dataUrl;
  return dataUrl;
}

/** Per test o reset cache in dev */
export function clearSanatecLogoCache(): void {
  cachedLogoDataUrl = null;
}
