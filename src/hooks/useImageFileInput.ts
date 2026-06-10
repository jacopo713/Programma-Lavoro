"use client";

import { useCallback, useRef, useState } from "react";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { compressImageFile } from "@/lib/compressImage";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_PHOTOS_PER_UPLOAD,
} from "@/lib/constants";

const MAX_FILE_SIZE_TOAST = `Immagine troppo grande — massimo ${MAX_FILE_SIZE_MB} MB`;

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

function buildHiddenFileInputProps(
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  options: { multiple?: boolean; capture?: "environment" | "user" },
) {
  return {
    type: "file" as const,
    accept: "image/*",
    multiple: options.multiple || undefined,
    capture: options.capture,
    "aria-hidden": true as const,
    tabIndex: -1,
    className: "sr-only",
    onChange,
  };
}

export function useImageFileInput({
  onPhotoReady,
  onPhotosReady,
  multiple = false,
  maxPhotos = MAX_PHOTOS_PER_UPLOAD,
  showToast,
}: UseImageFileInputOptions) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const [chooserOpen, setChooserOpen] = useState(false);

  const closeChooser = useCallback(() => {
    setChooserOpen(false);
  }, []);

  const openGallery = useCallback(() => {
    closeChooser();
    galleryInputRef.current?.click();
  }, [closeChooser]);

  const openCamera = useCallback(() => {
    closeChooser();
    cameraInputRef.current?.click();
  }, [closeChooser]);

  const openPicker = useCallback(() => {
    if (isMobile) {
      setChooserOpen(true);
      return;
    }
    openGallery();
  }, [isMobile, openGallery]);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast?.("Seleziona un file immagine (JPG, PNG…)", "warning");
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast?.(MAX_FILE_SIZE_TOAST, "warning");
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
        showToast?.(MAX_FILE_SIZE_TOAST, "warning");
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

  const galleryInputProps = {
    ref: galleryInputRef,
    ...buildHiddenFileInputProps(handleChange, { multiple }),
  };

  const cameraInputProps = {
    ref: cameraInputRef,
    ...buildHiddenFileInputProps(handleChange, { capture: "environment" }),
  };

  return {
    galleryInputRef,
    cameraInputRef,
    openPicker,
    openGallery,
    openCamera,
    processFile,
    processFiles,
    galleryInputProps,
    cameraInputProps,
    /** Alias retrocompatibile della galleria */
    inputProps: galleryInputProps,
    chooserOpen,
    closeChooser,
    showSourceChooser: isMobile,
  };
}
