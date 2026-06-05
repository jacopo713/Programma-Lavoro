"use client";

import {
  CircleAlert,
  CircleCheck,
  FileText,
  Trash2,
} from "lucide-react";
import type { ToastIcon } from "@/hooks/useToast";

interface ToastProps {
  message: string;
  icon: ToastIcon;
  visible: boolean;
  iconClassName: string;
}

function ToastIconComponent({
  icon,
  className,
}: {
  icon: ToastIcon;
  className: string;
}) {
  const size = 18;
  switch (icon) {
    case "success":
      return <CircleCheck size={size} className={className} aria-hidden />;
    case "danger":
      return <Trash2 size={size} className={className} aria-hidden />;
    case "pdf":
      return <FileText size={size} className={className} aria-hidden />;
    case "warning":
      return <CircleAlert size={size} className={className} aria-hidden />;
  }
}

export function Toast({ message, icon, visible, iconClassName }: ToastProps) {
  return (
    <div
      className={`toast${visible ? " show" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <ToastIconComponent icon={icon} className={iconClassName} />
      <span>{message}</span>
    </div>
  );
}
