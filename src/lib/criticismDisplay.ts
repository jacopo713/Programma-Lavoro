export function isDataUrlPhoto(value: string): boolean {
  return value.startsWith("data:");
}

export function isRemotePhoto(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function canSavePhotoEntry(title: string, photo: string | null): boolean {
  return title.trim().length > 0 && !!photo;
}

/** URL remoto o data URL — valido come src per img */
export function getPhotoDataUrl(photos: string[]): string | null {
  return photos[0] ?? null;
}
