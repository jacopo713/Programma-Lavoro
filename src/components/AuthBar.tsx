"use client";

import { Loader2, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

function userLabel(email: string | null | undefined): string {
  if (!email) return "Utente";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

export function AuthBar() {
  const { user, loading, configured, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthModalMode>("login");
  const [signingOut, setSigningOut] = useState(false);

  const openModal = (mode: AuthModalMode) => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <div className="auth-bar" role="navigation" aria-label="Account">
        {!configured ? (
          <span className="auth-bar-hint">Firebase non configurato</span>
        ) : loading ? (
          <span className="auth-bar-loading" aria-live="polite">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            <span className="sr-only">Caricamento sessione</span>
          </span>
        ) : user ? (
          <div className="auth-bar-user">
            <Link href="/profilo" className="auth-bar-profile" title={user.email ?? undefined}>
              <User size={16} aria-hidden />
              <span className="auth-bar-email">{userLabel(user.email)}</span>
            </Link>
            <button
              type="button"
              className="auth-btn auth-btn--ghost auth-btn--icon"
              aria-label="Esci"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              {signingOut ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <LogOut size={16} aria-hidden />
              )}
            </button>
          </div>
        ) : (
          <div className="auth-bar-actions">
            <button
              type="button"
              className="auth-btn auth-btn--ghost"
              onClick={() => openModal("login")}
            >
              Accedi
            </button>
            <button
              type="button"
              className="auth-btn auth-btn--primary"
              onClick={() => openModal("register")}
            >
              Registrati
            </button>
          </div>
        )}
      </div>

      <AuthModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onModeChange={setModalMode}
      />
    </>
  );
}
