"use client";

import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
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

  return <>{children}</>;
}
