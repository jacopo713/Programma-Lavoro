"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";
import { LegalConsentGate } from "@/components/LegalConsentGate";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured, authStatus, pendingLegalAcceptance, signOut } =
    useAuth();
  const [mode, setMode] = useState<AuthModalMode>("login");

  if (!configured) {
    return (
      <div className="auth-gate">
        <p className="auth-gate-message">
          Firebase non è configurato. Imposta le variabili d&apos;ambiente
          NEXT_PUBLIC_FIREBASE_*.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-gate" aria-busy="true">
        <Loader2 size={28} className="auth-gate-spinner animate-spin" aria-hidden />
        <p className="auth-gate-message">Verifica accesso…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-brand">
          <h1 className="auth-gate-title">{APP_NAME}</h1>
          <p className="auth-gate-lead">
            Accedi per salvare checklist e sedi, e sincronizzarle tra i tuoi
            dispositivi.
          </p>
        </div>
        <AuthModal
          open
          mandatory
          mode={mode}
          onClose={() => {}}
          onModeChange={setMode}
        />
      </div>
    );
  }

  if (pendingLegalAcceptance) {
    return (
      <div className="auth-gate">
        <LegalConsentGate />
      </div>
    );
  }

  if (authStatus === "checking") {
    return (
      <div className="auth-gate" aria-busy="true">
        <Loader2 size={28} className="auth-gate-spinner animate-spin" aria-hidden />
        <p className="auth-gate-message">Verifica autorizzazione…</p>
      </div>
    );
  }

  if (authStatus !== "authorized") {
    return (
      <div className="auth-gate">
        <div className="auth-gate-brand">
          <h1 className="auth-gate-title">{APP_NAME}</h1>
          <p className="auth-gate-lead">
            {authStatus === "error"
              ? "Non è stato possibile verificare l'accesso. Controlla la connessione e riprova."
              : "È stato raggiunto il numero massimo di utenti. Contatta l'amministratore per liberare un posto."}
          </p>
          {user.email ? (
            <p className="auth-gate-message">Accesso effettuato come {user.email}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="auth-btn auth-btn--primary"
          onClick={() => void signOut()}
        >
          <LogOut size={16} aria-hidden />
          <span>Esci</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
