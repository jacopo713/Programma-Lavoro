"use client";

import {
  RESOLVED_STATUS_LABEL,
  type CriticismFormStatus,
} from "@/lib/criticismStatus";
import {
  DEFAULT_SEVERITY,
  SEVERITY_OPTIONS,
} from "@/lib/severity";

function getSelectNumClass(status: CriticismFormStatus): string {
  if (status === "resolved") return "severity-select-num severity-select-num--resolved";
  if (status === 1) return "severity-select-num severity-select-num--monitor";
  if (status === 3) return "severity-select-num severity-select-num--grave";
  return "severity-select-num severity-select-num--moderate";
}

interface SeveritySelectProps {
  id?: string;
  value: CriticismFormStatus;
  onChange: (status: CriticismFormStatus) => void;
}

export function SeveritySelect({
  id = "criticism-severity",
  value,
  onChange,
}: SeveritySelectProps) {
  return (
    <div className="severity-select-wrap" data-severity={value}>
      <label className="form-field-label" htmlFor={id}>
        Livello criticità
      </label>
      <div className="severity-select-field">
        <span className={getSelectNumClass(value)} aria-hidden>
          {value === "resolved" ? "0" : value}
        </span>
        <select
          id={id}
          className="severity-select"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(
              raw === "resolved"
                ? "resolved"
                : (Number(raw) as CriticismFormStatus),
            );
          }}
        >
          <option value="resolved">0. {RESOLVED_STATUS_LABEL}</option>
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.level} value={opt.level}>
              {opt.level}. {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { DEFAULT_SEVERITY };
