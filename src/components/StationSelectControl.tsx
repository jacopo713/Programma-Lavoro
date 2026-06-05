"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Station } from "@/lib/types";

interface StationSelectControlProps {
  stations: Station[];
  activeStationId: string;
  onChange: (stationId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StationSelectControl({
  stations,
  activeStationId,
  onChange,
  disabled = false,
  className = "",
}: StationSelectControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const activeStation = stations.find((station) => station.id === activeStationId);
  const isDisabled = disabled || stations.length === 0;

  const close = useCallback(() => setOpen(false), []);

  const selectStation = useCallback(
    (stationId: string) => {
      if (stationId !== activeStationId) {
        onChange(stationId);
      }
      close();
    },
    [activeStationId, close, onChange],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  return (
    <div
      ref={rootRef}
      className={`station-select${open ? " station-select--open" : ""}${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        className="station-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={
          activeStation
            ? `Sede attiva: ${activeStation.name}. Apri elenco sedi`
            : "Seleziona sede di compilazione"
        }
        disabled={isDisabled}
        onClick={() => setOpen((current) => !current)}
      >
        <Building2 size={14} aria-hidden />
        <span className="station-select-label">Stazione</span>
        <span className="station-select-value">
          {activeStation?.name ?? "Seleziona"}
        </span>
        <ChevronDown
          size={14}
          className="station-select-chevron"
          aria-hidden
        />
      </button>

      {open ? (
        <div className="station-select-menu">
          <p className="station-select-menu-title">Sedi disponibili</p>
          <ul
            id={listId}
            className="station-select-list"
            role="listbox"
            aria-label="Stazioni disponibili"
          >
            {stations.map((station) => {
              const isActive = station.id === activeStationId;
              return (
                <li key={station.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`station-select-option${isActive ? " active" : ""}`}
                    onClick={() => selectStation(station.id)}
                  >
                    <span className="station-select-option-icon" aria-hidden>
                      <Building2 size={14} />
                    </span>
                    <span className="station-select-option-label">{station.name}</span>
                    {isActive ? (
                      <Check size={14} className="station-select-option-check" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
