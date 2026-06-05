"use client";

import { Pencil, Train } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_STATION_NAME_LENGTH } from "@/lib/constants";

interface StationNameControlProps {
  stationName: string;
  onSave: (name: string) => boolean;
  className?: string;
}

export function StationNameControl({
  stationName,
  onSave,
  className = "station-badge",
}: StationNameControlProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stationName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(stationName);
  }, [stationName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(stationName);
      setEditing(false);
      return;
    }
    if (trimmed !== stationName) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [draft, onSave, stationName]);

  const cancel = useCallback(() => {
    setDraft(stationName);
    setEditing(false);
  }, [stationName]);

  if (editing) {
    return (
      <div className={`${className} station-badge--editing`}>
        <Train size={14} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          className="station-name-input"
          value={draft}
          maxLength={MAX_STATION_NAME_LENGTH}
          aria-label="Nome stazione"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${className} station-badge-btn`}
      onClick={() => setEditing(true)}
      aria-label={`Stazione: ${stationName}. Clicca per modificare`}
      title="Modifica nome stazione"
    >
      <Train size={14} aria-hidden />
      <span className="station-badge-label">{stationName}</span>
      <Pencil size={12} className="station-badge-edit-icon" aria-hidden />
    </button>
  );
}
