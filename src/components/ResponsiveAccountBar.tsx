"use client";

import { AuthBar } from "@/components/AuthBar";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";

type ResponsiveAccountBarProps = {
  placement: "header" | "toolbar";
};

export function ResponsiveAccountBar({ placement }: ResponsiveAccountBarProps) {
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);

  if (placement === "header" && !isMobile) return null;
  if (placement === "toolbar" && isMobile) return null;

  return <AuthBar />;
}
