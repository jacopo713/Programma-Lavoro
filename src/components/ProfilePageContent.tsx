"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppToast } from "@/contexts/ToastContext";
import { MAX_STATION_NAME_LENGTH } from "@/lib/constants";

export function ProfilePageContent() {
  const { user, loading: authLoading, configured } = useAuth();
  const {
    profile,
    loading: profileLoading,
    openWizard,
    updateProfileFields,
    seedStationsFromProfile,
  } = useProfilePageState();
  const { showToast } = useAppToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [primaryStationName, setPrimaryStationName] = useState("");
  const [additionalStations, setAdditionalStations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPrimaryStationName(profile.primaryStationName);
    setAdditionalStations(profile.additionalStationNames);
  }, [profile]);

  const handleSave = async () => {
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Inserisci nome e cognome.");
      return;
    }
    if (!primaryStationName.trim()) {
      setError("Inserisci la stazione di riferimento.");
      return;
    }

    setSaving(true);
    try {
      const additionalStationNames = additionalStations
        .map((name) => name.trim())
        .filter(Boolean);

      await updateProfileFields({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        primaryStationName: primaryStationName.trim(),
        additionalStationNames,
      });

      seedStationsFromProfile(
        primaryStationName.trim(),
        additionalStationNames,
      );

      showToast("Profilo aggiornato", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
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

  if (!configured) {
    return (
      <div className="profile-page">
        <h1>Il mio Profilo</h1>
        <p className="profile-page-muted">Firebase non configurato.</p>
        <Footer />
      </div>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="profile-page profile-page--loading">
        <Loader2 size={24} className="animate-spin" aria-hidden />
        <span>Caricamento profilo…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <h1>Il mio Profilo</h1>
        <p className="profile-page-muted">
          Accedi per gestire i dati dell&apos;operatore e le preferenze dell&apos;account.
        </p>
        <Link href="/" className="auth-btn auth-btn--primary profile-page-login-link">
          Torna alla checklist
        </Link>
        <Footer />
      </div>
    );
  }

  const onboardingStatus = profile?.onboardingCompleted
    ? "Completato"
    : profile?.onboardingSkippedAt
      ? "Da completare"
      : "Non configurato";

  return (
    <div className="profile-page">
      <header className="profile-page-header">
        <div>
          <h1>Il mio Profilo</h1>
          <p className="profile-page-lead">
            Gestisci i dati dell&apos;operatore e le stazioni di riferimento.
          </p>
        </div>
        <span
          className={`profile-status-badge${
            profile?.onboardingCompleted
              ? " profile-status-badge--done"
              : " profile-status-badge--pending"
          }`}
        >
          {onboardingStatus}
        </span>
      </header>

      {!profile?.onboardingCompleted ? (
        <div className="profile-page-banner">
          <p>Completa il profilo per personalizzare stazioni e PDF.</p>
          <button
            type="button"
            className="auth-btn auth-btn--ghost"
            onClick={openWizard}
          >
            Configurazione guidata
          </button>
        </div>
      ) : null}

      <form
        className="profile-page-form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <div className="profile-page-grid">
          <label className="auth-field">
            <span>Nome</span>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              disabled={saving}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>Cognome</span>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              disabled={saving}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
        </div>

        <label className="auth-field">
          <span>Stazione di riferimento</span>
          <input
            type="text"
            maxLength={MAX_STATION_NAME_LENGTH}
            value={primaryStationName}
            disabled={saving}
            onChange={(event) => setPrimaryStationName(event.target.value)}
          />
        </label>

        <div className="onboarding-station-list">
          <div className="onboarding-station-list-head">
            <span>Altre stazioni</span>
            <button
              type="button"
              className="onboarding-station-add"
              disabled={saving}
              onClick={addAdditionalStation}
            >
              <Plus size={14} aria-hidden />
              Aggiungi
            </button>
          </div>

          {additionalStations.length === 0 ? (
            <p className="onboarding-station-empty">
              Nessuna stazione aggiuntiva.
            </p>
          ) : (
            additionalStations.map((name, index) => (
              <div key={`profile-station-${index}`} className="onboarding-station-row">
                <input
                  type="text"
                  maxLength={MAX_STATION_NAME_LENGTH}
                  value={name}
                  disabled={saving}
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
                  disabled={saving}
                  onClick={() => removeAdditionalStation(index)}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))
          )}
        </div>

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="profile-page-actions">
          <button
            type="button"
            className="auth-btn auth-btn--ghost"
            disabled={saving}
            onClick={openWizard}
          >
            Ricomincia configurazione guidata
          </button>
          <button type="submit" className="auth-btn auth-btn--primary" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
            <span>Salva profilo</span>
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}

function useProfilePageState() {
  const profileState = useUserProfile();
  const { seedStationsFromProfile } = useChecklistContext();
  return { ...profileState, seedStationsFromProfile };
}
