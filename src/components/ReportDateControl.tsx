"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  formatReportDateIT,
  getReportDateWindowBounds,
  isReportDateInWindow,
  parseIsoDate,
  toIsoDate,
} from "@/lib/format";

interface ReportDateControlProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;

const MONTH_LABELS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
] as const;

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function canNavigateToMonth(
  year: number,
  month: number,
  bounds: { min: Date; max: Date },
): boolean {
  const start = monthStart(year, month);
  const end = new Date(year, month + 1, 0);
  return end >= bounds.min && start <= bounds.max;
}

export function ReportDateControl({
  value,
  onChange,
  className = "",
}: ReportDateControlProps) {
  const triggerId = useId();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const bounds = useMemo(() => getReportDateWindowBounds(), []);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const initialView = selectedDate ?? bounds.max;
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  const close = useCallback(() => setOpen(false), []);

  const openCalendar = useCallback(() => {
    const nextView = selectedDate ?? bounds.max;
    setViewYear(nextView.getFullYear());
    setViewMonth(nextView.getMonth());
    setOpen(true);
  }, [bounds.max, selectedDate]);

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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = (monthStart(viewYear, viewMonth).getDay() + 6) % 7;

  const canGoPrev = canNavigateToMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
    bounds,
  );
  const canGoNext = canNavigateToMonth(
    viewMonth === 11 ? viewYear + 1 : viewYear,
    viewMonth === 11 ? 0 : viewMonth + 1,
    bounds,
  );

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
      return;
    }
    setViewMonth((month) => month - 1);
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
      return;
    }
    setViewMonth((month) => month + 1);
  };

  const selectDate = (isoDate: string) => {
    if (!isReportDateInWindow(isoDate)) return;
    onChange(isoDate);
    close();
  };

  const displayValue = value ? formatReportDateIT(value) : "Seleziona";
  const rangeLabel = `${formatReportDateIT(toIsoDate(bounds.min))} — ${formatReportDateIT(toIsoDate(bounds.max))}`;

  return (
    <div
      ref={rootRef}
      className={`report-date-control${open ? " report-date-control--open" : ""}${className ? ` ${className}` : ""}`}
    >
      <button
        id={triggerId}
        type="button"
        className="report-date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={
          value
            ? `Data di redazione: ${displayValue}. Apri calendario`
            : "Seleziona data di redazione"
        }
        onClick={() => (open ? close() : openCalendar())}
      >
        <CalendarDays size={14} aria-hidden />
        <span className="report-date-label">Data redazione</span>
        <span className="report-date-value">{displayValue}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          className="report-date-menu"
          role="dialog"
          aria-label="Calendario data di redazione"
        >
          <div className="report-date-menu-header">
            <button
              type="button"
              className="report-date-nav-btn"
              aria-label="Mese precedente"
              disabled={!canGoPrev}
              onClick={goPrevMonth}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <p className="report-date-menu-title">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              className="report-date-nav-btn"
              aria-label="Mese successivo"
              disabled={!canGoNext}
              onClick={goNextMonth}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          <div className="report-date-weekdays" aria-hidden>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="report-date-weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="report-date-grid" role="grid" aria-label="Giorni del mese">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span
                key={`blank-${index}`}
                className="report-date-cell report-date-cell--blank"
                aria-hidden
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const isoDate = toIsoDate(new Date(viewYear, viewMonth, day));
              const selectable = isReportDateInWindow(isoDate);
              const isSelected = value === isoDate;
              const isToday = isoDate === todayIso;

              return (
                <button
                  key={isoDate}
                  type="button"
                  role="gridcell"
                  className={`report-date-cell report-date-day${selectable ? " report-date-day--in-range" : " report-date-day--out-of-range"}${isSelected ? " report-date-day--selected" : ""}${isToday ? " report-date-day--today" : ""}`}
                  disabled={!selectable}
                  aria-label={formatReportDateIT(isoDate)}
                  aria-selected={isSelected}
                  onClick={() => selectDate(isoDate)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="report-date-hint">
            Periodo selezionabile: {rangeLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
