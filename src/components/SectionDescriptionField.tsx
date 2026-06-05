"use client";

import { useEffect, useState } from "react";
import { MAX_SECTION_DESCRIPTION_LENGTH } from "@/lib/constants";

interface SectionDescriptionFieldProps {
  sectionTitle: string;
  value: string;
  exampleHint?: string;
  onSave: (value: string) => void;
}

export function SectionDescriptionField({
  sectionTitle,
  value,
  exampleHint,
  onSave,
}: SectionDescriptionFieldProps) {
  const [draft, setDraft] = useState(value);
  const id = `section-desc-${sectionTitle.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onSave(draft);
  };

  return (
    <div className="section-description-field">
      <label className="form-field-label" htmlFor={id}>
        Descrizione area — {sectionTitle}
      </label>
      <textarea
        id={id}
        className="section-description-input"
        value={draft}
        maxLength={MAX_SECTION_DESCRIPTION_LENGTH}
        rows={4}
        placeholder="Sintesi generale dell'area (come nel report): osservazioni, contesto, elementi trasversali alle singole criticità..."
        aria-label={`Descrizione area ${sectionTitle}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
      {exampleHint ? (
        <p className="section-description-example">{exampleHint}</p>
      ) : null}
      <p className="section-description-hint">
        Compare nel PDF sotto il titolo dell&apos;area. Salvataggio automatico quando
        esci dal campo.
      </p>
    </div>
  );
}
