"use client";

import {
  Building2,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppToast } from "@/contexts/ToastContext";
import { MAX_STATION_NAME_LENGTH } from "@/lib/constants";

const STEPS = [
  {
    title: "Chi sei",
    lead: "Questi dati compaiono nel PDF di ispezione e identificano l'operatore.",
  },
  {
    title: "Le tue stazioni",
    lead: "Indica la stazione di riferimento e le altre che segui. Potrai modificarle da Stazioni.",
  },
  {
    title: "Come funziona",
    lead: "Panoramica rapida delle funzioni principali dell'app.",
  },
] as const;

const GUIDE_ITEMS = [
  {
    icon: ClipboardList,
    title: "Checklist",
    text: "Compila le 12 aree di ispezione per la stazione attiva.",
  },
  {
    icon: TriangleAlert,
    title: "Criticità",
    text: "Aggiungi foto, gravità e note. Le foto richiedono l'accesso per il salvataggio cloud.",
  },
  {
    icon: Building2,
    title: "Stazioni",
    text: "Passa tra stazione di riferimento e altre stazioni assegnate.",
  },
  {
    icon: FileText,
    title: "PDF",
    text: "Esporta il report con nome operatore, riepilogo e allegati fotografici.",
  },
] as const;

export function OnboardingWizard() {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { showToast } = useAppToast();
  const { seedStationsFromProfile } = useChecklistContext();
  const {
    profile,
    wizardOpen,
    closeWizard,
    completeOnboardingFlow,
    skipOnboardingFlow,
  } = useUserProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [primaryStationName, setPrimaryStationName] = useState("");
  const [additionalStations, setAdditionalStations] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (wizardOpen && !dialog.open) {
      dialog.showModal();
    } else if (!wizardOpen && dialog.open) {
      dialog.close();
    }
  }, [wizardOpen]);

  useEffect(() => {
    if (!wizardOpen) return;
    setStep(0);
    setError(null);
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setPrimaryStationName(profile?.primaryStationName ?? "");
    setAdditionalStations(profile?.additionalStationNames ?? []);
  }, [wizardOpen, profile]);

  const handleCloseAttempt = useCallback(() => {
    if (submitting) return;
    closeWizard();
  }, [closeWizard, submitting]);

  const validateStepOne = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Inserisci nome e cognome.");
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!primaryStationName.trim()) {
      setError("Inserisci la stazione di riferimento.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 0 && !validateStepOne()) return;
    if (step === 1 && !validateStepTwo()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSkip = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await skipOnboardingFlow();
      showToast("Puoi completare il profilo da Il mio Profilo", "warning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!validateStepOne() || !validateStepTwo()) {
      if (!validateStepOne()) setStep(0);
      else setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const additionalStationNames = additionalStations
        .map((name) => name.trim())
        .filter(Boolean);

      await completeOnboardingFlow({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        primaryStationName: primaryStationName.trim(),
        additionalStationNames,
      });

      const seeded = seedStationsFromProfile(
        primaryStationName.trim(),
        additionalStationNames,
      );
      if (!seeded) {
        showToast("Profilo salvato, ma le stazioni non sono state aggiornate", "warning");
      } else {
        showToast("Profilo configurato", "success");
      }
      closeWizard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  const addAdditionalStation = () => {
    setAdditionalStations((current) => [...current, ""]);
  };

  const updateAdditionalStation = (index: number, value: string) => {
    setAdditionalStations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    );
  };

  const removeAdditionalStation = (index: number) => {
    setAdditionalStations((current) =>
      current.filter((_, entryIndex) => entryIndex !== index),
    );
  };

  if (!wizardOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="onboarding-wizard"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        handleCloseAttempt();
      }}
      onClose={handleCloseAttempt}
    >
      <div className="onboarding-wizard-panel">
        <div className="onboarding-wizard-progress" aria-hidden>
          {STEPS.map((entry, index) => (
            <span
              key={entry.title}
              className={`onboarding-wizard-progress-step${
                index <= step ? " onboarding-wizard-progress-step--active" : ""
              }`}
            />
          ))}
        </div>

        <p className="onboarding-wizard-step-label">
          Passo {step + 1} di {STEPS.length}
        </p>
        <h2 id={titleId} className="onboarding-wizard-title">
          {STEPS[step].title}
        </h2>
        <p className="onboarding-wizard-lead">{STEPS[step].lead}</p>

        {step === 0 ? (
          <div className="onboarding-wizard-fields">
            <label className="auth-field">
              <span>Nome *</span>
              <input
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                disabled={submitting}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label className="auth-field">
              <span>Cognome *</span>
              <input
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                disabled={submitting}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="onboarding-wizard-fields">
            <label className="auth-field">
              <span>Stazione di riferimento *</span>
              <input
                type="text"
                required
                maxLength={MAX_STATION_NAME_LENGTH}
                value={primaryStationName}
                disabled={submitting}
                onChange={(event) => setPrimaryStationName(event.target.value)}
              />
            </label>

            <div className="onboarding-station-list">
              <div className="onboarding-station-list-head">
                <span>Altre stazioni</span>
                <button
                  type="button"
                  className="onboarding-station-add"
                  disabled={submitting}
                  onClick={addAdditionalStation}
                >
                  <Plus size={14} aria-hidden />
                  Aggiungi
                </button>
              </div>

              {additionalStations.length === 0 ? (
                <p className="onboarding-station-empty">
                  Nessuna stazione aggiuntiva (opzionale).
                </p>
              ) : (
                additionalStations.map((name, index) => (
                  <div key={`extra-station-${index}`} className="onboarding-station-row">
                    <input
                      type="text"
                      maxLength={MAX_STATION_NAME_LENGTH}
                      value={name}
                      disabled={submitting}
                      placeholder="Nome stazione"
                      aria-label={`Altra stazione ${index + 1}`}
                      onChange={(event) =>
                        updateAdditionalStation(index, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="onboarding-station-remove"
                      aria-label="Rimuovi stazione"
                      disabled={submitting}
                      onClick={() => removeAdditionalStation(index)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <ul className="onboarding-guide-list">
            {GUIDE_ITEMS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="onboarding-guide-item">
                <span className="onboarding-guide-icon" aria-hidden>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="onboarding-wizard-actions">
          {step > 0 ? (
            <button
              type="button"
              className="auth-btn auth-btn--ghost"
              disabled={submitting}
              onClick={handleBack}
            >
              Indietro
            </button>
          ) : (
            <span />
          )}

          <div className="onboarding-wizard-actions-main">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="auth-btn auth-btn--primary"
                disabled={submitting}
                onClick={handleNext}
              >
                Avanti
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="auth-link-btn onboarding-wizard-skip"
                  disabled={submitting}
                  onClick={() => void handleSkip()}
                >
                  Salta per ora
                </button>
                <button
                  type="button"
                  className="auth-btn auth-btn--primary"
                  disabled={submitting}
                  onClick={() => void handleComplete()}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                  ) : null}
                  <span>Inizia</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function OnboardingRunner() {
  const { user } = useAuth();
  const { wizardOpen } = useUserProfile();

  if (!user || !wizardOpen) return null;
  return <OnboardingWizard />;
}
