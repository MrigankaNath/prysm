import { useState, useEffect } from "react";
import AuthForm from "./AuthForm";

function AuthModal({ open, initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-card-grain" aria-hidden="true" />

        <div className="auth-card-inner">
          <h2 className="auth-card-title">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="auth-card-subtitle">
            {mode === "signup"
              ? "Start building a feed worth returning to."
              : "Pick up where you left off."}
          </p>

          <AuthForm mode={mode} onModeChange={setMode} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
