"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

export function Lightbox({ src, onClose }: LightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  const open = Boolean(src);

  return (
    <div
      className={`lightbox${open ? " open" : ""}`}
      role="dialog"
      aria-label="Anteprima foto"
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="lightbox-close"
        onClick={onClose}
        aria-label="Chiudi anteprima"
      >
        <X size={20} aria-hidden />
      </button>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Foto ingrandita" />
      ) : null}
    </div>
  );
}
