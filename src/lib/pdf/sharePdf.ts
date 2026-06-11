export function buildPdfFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: "application/pdf" });
}

export function canSharePdfFile(blob: Blob, filename: string): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const file = buildPdfFile(blob, filename);
  if (typeof navigator.canShare === "function") {
    return navigator.canShare({ files: [file] });
  }
  return true;
}

export type SharePdfResult = "shared" | "aborted" | "failed";

export async function sharePdfFile(
  blob: Blob,
  filename: string,
): Promise<SharePdfResult> {
  const file = buildPdfFile(blob, filename);
  try {
    await navigator.share({
      files: [file],
      title: filename,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "aborted";
    }
    return "failed";
  }
}
