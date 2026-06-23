import { getSeverityClass, getSeverityReportBannerLabel } from "@/lib/severity";
import {
  getCriticismReportStatusLabel,
  RESOLVED_STATUS_LABEL,
} from "@/lib/criticismStatus";
import type { Criticism, SeverityLevel } from "@/lib/types";

interface SeverityLabelBannerProps {
  level: SeverityLevel;
  resolved?: boolean;
}

export function SeverityLabelBanner({ level, resolved = false }: SeverityLabelBannerProps) {
  if (resolved) {
    return (
      <div
        className="severity-banner severity--resolved"
        role="status"
        aria-label={`Livello: ${RESOLVED_STATUS_LABEL}`}
      >
        <span className="severity-banner-dot" aria-hidden />
        <span className="severity-banner-label">{RESOLVED_STATUS_LABEL}</span>
      </div>
    );
  }

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

export function CriticismStatusBanner({
  item,
}: {
  item: Pick<Criticism, "severity" | "resolved">;
}) {
  return (
    <SeverityLabelBanner level={item.severity} resolved={item.resolved} />
  );
}

export { getCriticismReportStatusLabel };
