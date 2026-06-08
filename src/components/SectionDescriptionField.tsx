"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MAX_SECTION_DESCRIPTION_LENGTH } from "@/lib/constants";

interface SectionDescriptionFieldProps {
  sectionTitle: string;
  value: string;
  placeholder: string;
  onSave: (value: string) => void;
}

export function SectionDescriptionField({
  sectionTitle,
  value,
  placeholder,
  onSave,
}: SectionDescriptionFieldProps) {
  const [draft, setDraft] = useState(value);
  const id = `section-desc-${sectionTitle.replace(/\s+/g, "-").toLowerCase()}`;
  const isDirty = draft !== value;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = () => {
    if (!isDirty) return;
    onSave(draft);
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
        placeholder={placeholder}
        aria-label={`Descrizione area ${sectionTitle}`}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="form-buttons section-description-actions">
        <button
          type="button"
          className="btn-save"
          disabled={!isDirty}
          onClick={handleSave}
        >
          <Check size={16} aria-hidden />
          Salva descrizione
        </button>
      </div>
      <p className="section-description-hint">
        Compare nel PDF sotto il titolo dell&apos;area. Premi Salva per confermare
        le modifiche.
      </p>
    </div>
  );
}
