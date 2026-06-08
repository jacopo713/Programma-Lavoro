"use client";

import { useCallback, useRef } from "react";
import { compressImageFile } from "@/lib/compressImage";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_PHOTOS_PER_UPLOAD,
} from "@/lib/constants";

export type ImageFileInputToast = (
  message: string,
  icon?: "warning" | "success" | "danger" | "pdf",
) => void;

interface UseImageFileInputOptions {
  onPhotoReady?: (dataUrl: string) => void;
  onPhotosReady?: (dataUrls: string[]) => void;
  multiple?: boolean;
  maxPhotos?: number;
  showToast?: ImageFileInputToast;
}

export function useImageFileInput({
  onPhotoReady,
  onPhotosReady,
  multiple = false,
  maxPhotos = MAX_PHOTOS_PER_UPLOAD,
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
        .then((dataUrl) => {
          onPhotoReady?.(dataUrl);
          onPhotosReady?.([dataUrl]);
        })
        .catch(() => {
          showToast?.("Formato immagine non supportato", "warning");
        });
    },
    [onPhotoReady, onPhotosReady, showToast],
  );

  const processFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        showToast?.("Seleziona un file immagine (JPG, PNG…)", "warning");
        return;
      }

      const oversized = imageFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
      if (oversized) {
        showToast?.("Immagine troppo grande — massimo 10 MB", "warning");
        return;
      }

      const limited = imageFiles.slice(0, maxPhotos);
      if (imageFiles.length > maxPhotos) {
        showToast?.(
          `Puoi selezionare al massimo ${maxPhotos} foto alla volta`,
          "warning",
        );
      }

      void Promise.all(limited.map((file) => compressImageFile(file)))
        .then((dataUrls) => {
          if (dataUrls.length === 1) {
            onPhotoReady?.(dataUrls[0]);
          }
          onPhotosReady?.(dataUrls);
        })
        .catch(() => {
          showToast?.("Formato immagine non supportato", "warning");
        });
    },
    [maxPhotos, onPhotoReady, onPhotosReady, showToast],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length === 0) return;

      if (multiple) {
        processFiles(files);
      } else {
        processFile(files[0]);
      }
    },
    [multiple, processFile, processFiles],
  );

  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "image/*",
    multiple: multiple || undefined,
    "aria-hidden": true as const,
    tabIndex: -1,
    className: "sr-only",
    onChange: handleChange,
  };

  return { inputRef, openPicker, processFile, processFiles, inputProps };
}
