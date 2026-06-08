export function isDataUrlPhoto(value: string): boolean {
  return value.startsWith("data:");
}

export function isRemotePhoto(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function hasValidPhoto(photo: string | null | undefined): boolean {
  return Boolean(photo);
}

export function canSavePhotoEntry(
  title: string,
  photos: string[] | string | null,
): boolean {
  const list = Array.isArray(photos) ? photos : photos ? [photos] : [];
  return title.trim().length > 0 && list.length > 0;
}

/** URL remoto o data URL — valido come src per img */
export function getPhotoDataUrl(photos: string[]): string | null {
  return photos[0] ?? null;
}
