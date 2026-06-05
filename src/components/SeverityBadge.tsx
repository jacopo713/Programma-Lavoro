import { getSeverityClass, getSeverityLabel } from "@/lib/severity";
import type { SeverityLevel } from "@/lib/types";

interface SeverityBadgeProps {
  level: SeverityLevel;
  listNumber: number;
}

export function SeverityBadge({ level, listNumber }: SeverityBadgeProps) {
  const levelLabel = getSeverityLabel(level);
  return (
    <div className="crit-meta-severity">
      <span
        className={`severity-num severity-num--card ${getSeverityClass(level)}`}
        title={levelLabel}
        aria-label={`Voce ${listNumber}, ${levelLabel}`}
      >
        {listNumber}
      </span>
    </div>
  );
}
