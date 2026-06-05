"use client";

import {
  DEFAULT_SEVERITY,
  getSeverityClass,
  SEVERITY_OPTIONS,
} from "@/lib/severity";
import type { SeverityLevel } from "@/lib/types";

interface SeveritySelectProps {
  id?: string;
  value: SeverityLevel;
  onChange: (level: SeverityLevel) => void;
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
        <span
          className={`severity-select-dot ${getSeverityClass(value)}`}
          aria-hidden
        />
        <select
          id={id}
          className="severity-select"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) as SeverityLevel)}
        >
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
