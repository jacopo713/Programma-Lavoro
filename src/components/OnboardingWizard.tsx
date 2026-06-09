"use client";

import {
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppToast } from "@/contexts/ToastContext";
import { APP_NAME, DEFAULT_STATION_NAME } from "@/lib/constants";

const STEPS = [
  {
    title: "Benvenuto",
    lead: `${APP_NAME}: compila le aree della checklist, aggiungi criticità con foto e note, poi esporta tutto in un report PDF. Puoi usare l'app per qualsiasi sede o progetto.`,
  },
  {
    title: "Chi sei",
    lead: "Nome e cognome compaiono nel PDF come riferimento di chi ha compilato la checklist.",
  },
  {
    title: "Come funziona",
    lead: "Panoramica rapida delle funzioni principali.",
  },
] as const;

const GUIDE_ITEMS = [
  {
    icon: ClipboardList,
    title: "Checklist",
    text: "Compila le descrizioni per ogni area e registra le criticità con gravità e foto.",
  },
  {
    icon: TriangleAlert,
    title: "Criticità",
    text: "Ogni voce può includere titolo, note e allegati fotografici nel report.",
  },
  {
    icon: FileText,
    title: "PDF",
    text: "Esporta il documento con riepilogo, descrizioni per area ed evidenze fotografiche.",
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
    dismissWizard,
    completeOnboardingFlow,
    skipOnboardingFlow,
  } = useUserProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
  }, [wizardOpen, profile]);

  const handleCloseAttempt = useCallback(() => {
    if (submitting) return;
    void dismissWizard();
  }, [dismissWizard, submitting]);

  const validateStepOne = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Inserisci nome e cognome.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !validateStepOne()) return;
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
    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const primaryStationName =
        profile?.primaryStationName?.trim() || DEFAULT_STATION_NAME;
      const additionalStationNames = profile?.additionalStationNames ?? [];

      await completeOnboardingFlow({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        primaryStationName,
        additionalStationNames,
      });

      const seeded = seedStationsFromProfile(
        primaryStationName,
        additionalStationNames,
      );
      if (!seeded) {
        showToast("Profilo salvato", "success");
      } else {
        showToast("Configurazione completata", "success");
      }
      closeWizard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
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

        {step === 1 ? (
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
  const { user, authStatus, pendingLegalAcceptance } = useAuth();
  const { wizardOpen } = useUserProfile();

  if (
    !user ||
    authStatus !== "authorized" ||
    pendingLegalAcceptance ||
    !wizardOpen
  ) {
    return null;
  }
  return <OnboardingWizard />;
}
