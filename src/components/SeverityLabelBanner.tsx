import { getSeverityClass, getSeverityReportBannerLabel } from "@/lib/severity";
import type { SeverityLevel } from "@/lib/types";

interface SeverityLabelBannerProps {
  level: SeverityLevel;
}

export function SeverityLabelBanner({ level }: SeverityLabelBannerProps) {
  const label = getSeverityReportBannerLabel(level);
  return (
    <div
      className={`severity-banner ${getSeverityClass(level)}`}
      role="status"
      aria-label={`Livello: ${label}`}
    >
      <span className="severity-banner-dot" aria-hidden />
      <span className="severity-banner-label">{label}</span>
    </div>
  );
}
