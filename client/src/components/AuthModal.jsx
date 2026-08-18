import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function AuthModal({ open, initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setMessage("");
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(
        error ? error.message : "Check your email to confirm your account.",
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        onClose();
      }
    }

    setLoading(false);
  };

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

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
            />

            <span className="rainbow-wrap">
              <span className="rainbow-glow" aria-hidden="true" />
              <button type="submit" className="rainbow-button" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Sign Up"
                    : "Log In"}
              </button>
            </span>
          </form>

          {message && <p className="auth-message">{message}</p>}

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup"
              ? "Already have an account? Log in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
