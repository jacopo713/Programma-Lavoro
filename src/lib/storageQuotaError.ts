export class StorageQuotaError extends Error {
  constructor() {
    super("Quota localStorage superata");
    this.name = "StorageQuotaError";
  }
}

export function isStorageQuotaError(err: unknown): boolean {
  return (
    err instanceof StorageQuotaError ||
    (err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.code === 22))
  );
}

export function rethrowIfQuotaError(err: unknown): never {
  if (isStorageQuotaError(err)) {
    throw new StorageQuotaError();
  }
  throw err;
}
