"use client";

import { useCallback, useRef } from "react";
import { compressImageFile } from "@/lib/compressImage";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export type ImageFileInputToast = (
  message: string,
  icon?: "warning" | "success" | "danger" | "pdf",
) => void;

interface UseImageFileInputOptions {
  onPhotoReady: (dataUrl: string) => void;
  showToast?: ImageFileInputToast;
}

export function useImageFileInput({
  onPhotoReady,
  showToast,
}: UseImageFileInputOptions) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast?.("Seleziona un file immagine (JPG, PNG…)", "warning");
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast?.("Immagine troppo grande — massimo 10 MB", "warning");
        return;
      }

      void compressImageFile(file)
        .then(onPhotoReady)
        .catch(() => {
          showToast?.("Formato immagine non supportato", "warning");
        });
    },
    [onPhotoReady, showToast],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) processFile(file);
    },
    [processFile],
  );

  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "image/*",
    "aria-hidden": true as const,
    tabIndex: -1,
    className: "sr-only",
    onChange: handleChange,
  };

  return { inputRef, openPicker, processFile, inputProps };
}
