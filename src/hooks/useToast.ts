"use client";

import { useCallback, useRef, useState } from "react";

export type ToastIcon = "success" | "danger" | "pdf" | "warning";

interface ToastState {
  message: string;
  icon: ToastIcon;
  visible: boolean;
}

const ICON_CLASS: Record<ToastIcon, string> = {
  success: "toast-icon-success",
  danger: "toast-icon-danger",
  pdf: "toast-icon-pdf",
  warning: "toast-icon-warning",
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    icon: "success",
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, icon: ToastIcon = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, icon, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const iconClassName = ICON_CLASS[toast.icon];

  return { toast, showToast, iconClassName };
}
