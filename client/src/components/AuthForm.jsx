import { useState, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { IconCheck, IconEye, IconEyeOff, IconAlert } from "./Icons";

/* Supabase's errors are written for developers. These are written for the
   person who just mistyped their password. */
const FRIENDLY_ERRORS = [
  [/invalid login credentials/i, "That email and password don't match. Check both and try again."],
  [/email not confirmed/i, "Almost there — confirm your email from the link we sent, then log in."],
  [/user already registered|already been registered/i, "That email already has an account. Try logging in instead."],
  [/rate limit|too many requests/i, "Too many attempts. Wait a minute and try again."],
  [/password should be at least/i, "Passwords need at least 8 characters."],
  [/unable to validate email/i, "That doesn't look like a valid email address."],
  [/network|fetch/i, "Couldn't reach the server. Check your connection and try again."],
];

function humanise(message) {
  const match = FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message || ""));
  return match ? match[1] : message || "Something went wrong. Try again.";
}

// Deliberately permissive — the server is the real authority on deliverability,
// and over-strict regexes reject valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

function passwordStrength(value) {
  if (!value) return { level: 0, label: "" };
  let score = 0;
  if (value.length >= MIN_PASSWORD) score += 1;
  if (value.length >= 12) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || (/[A-Z]/.test(value) && /[0-9]/.test(value)))
    score += 1;
  return [
    { level: 1, label: "Too short" },
    { level: 1, label: "Weak" },
    { level: 2, label: "Good" },
    { level: 3, label: "Strong" },
  ][score];
}

function AuthForm({ mode, onModeChange, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [reveal, setReveal] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const formRef = useRef(null);

  const isSignup = mode === "signup";
  const strength = useMemo(() => passwordStrength(password), [password]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = isSignup
    ? password.length >= MIN_PASSWORD
    : password.length > 0;
  const ready = emailValid && passwordValid;

  // Only complain about a field once the user has left it — validating while
  // someone is still typing their address is the classic hostile form.
  const emailError = touched.email && email && !emailValid;
  const passwordError =
    touched.password && password && isSignup && password.length < MIN_PASSWORD;

  /* What the button is waiting for. Shown instead of leaving a dead control
     with no explanation — the reason a disabled button feels broken is that it
     never says why. */
  const blocker = !email
    ? "Enter your email to continue"
    : !emailValid
      ? "That email doesn't look right yet"
      : !password
        ? "Enter your password"
        : isSignup && password.length < MIN_PASSWORD
          ? `${MIN_PASSWORD - password.length} more character${
              MIN_PASSWORD - password.length === 1 ? "" : "s"
            } needed`
          : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ready || status === "submitting") return;

    setStatus("submitting");
    setError("");
    setNotice("");

    try {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        setStatus("success");
        setNotice("Check your inbox to confirm your account.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        setStatus("success");
        // Hold the confirmed state briefly so the transition is legible
        // rather than a flash before the redirect.
        setTimeout(() => onSuccess?.(), 550);
      }
    } catch (err) {
      setStatus("error");
      setError(humanise(err?.message));
      formRef.current?.classList.remove("shake");
      // Reflow so the animation replays on a second failed attempt.
      void formRef.current?.offsetWidth;
      formRef.current?.classList.add("shake");
    }
  };

  const buttonLabel = {
    submitting: isSignup ? "Creating account…" : "Signing in…",
    success: isSignup ? "Account created" : "Welcome back",
  }[status] || (isSignup ? "Create account" : "Log in");

  return (
    <form
      ref={formRef}
      className={`authf${status === "error" ? " has-error" : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="authf-field">
        <span className="authf-label">Email</span>
        <span className="authf-input-wrap">
          <input
            type="email"
            className={`authf-input${emailError ? " invalid" : ""}${
              emailValid ? " valid" : ""
            }`}
            placeholder="you@example.com"
            value={email}
            autoComplete="email"
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          />
          {emailValid && <IconCheck className="authf-tick" />}
        </span>
        {emailError && (
          <span className="authf-hint error">
            <IconAlert /> Enter a valid email address
          </span>
        )}
      </label>

      <label className="authf-field">
        <span className="authf-label">Password</span>
        <span className="authf-input-wrap">
          <input
            type={reveal ? "text" : "password"}
            className={`authf-input${passwordError ? " invalid" : ""}`}
            placeholder={isSignup ? `At least ${MIN_PASSWORD} characters` : "••••••••"}
            value={password}
            autoComplete={isSignup ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onKeyUp={(e) =>
              setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))
            }
          />
          <button
            type="button"
            className="authf-reveal"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {reveal ? <IconEyeOff /> : <IconEye />}
          </button>
        </span>

        {isSignup && password && (
          <span className="authf-strength" data-level={strength.level}>
            <span className="authf-bar" />
            <span className="authf-bar" />
            <span className="authf-bar" />
            <span className="authf-strength-label">{strength.label}</span>
          </span>
        )}

        {capsOn && (
          <span className="authf-hint warn">
            <IconAlert /> Caps Lock is on
          </span>
        )}
      </label>

      {/* The button reads its own state: dormant until the form is actually
          submittable, lit when it is, then working, then confirmed. */}
      <button
        type="submit"
        className={`authf-submit is-${status}${ready ? " ready" : ""}`}
        disabled={!ready || status === "submitting" || status === "success"}
      >
        <span className="authf-submit-face">
          {status === "submitting" && <span className="authf-spinner" aria-hidden="true" />}
          {status === "success" && <IconCheck className="authf-submit-tick" />}
          {buttonLabel}
        </span>
      </button>

      <div className="authf-foot" aria-live="polite">
        {error ? (
          <span className="authf-hint error">
            <IconAlert /> {error}
          </span>
        ) : notice ? (
          <span className="authf-hint ok">
            <IconCheck /> {notice}
          </span>
        ) : blocker ? (
          <span className="authf-hint muted">{blocker}</span>
        ) : (
          <span className="authf-hint muted">
            {isSignup ? "Ready to create your account" : "Ready when you are"}
          </span>
        )}
      </div>

      <button
        type="button"
        className="authf-toggle"
        onClick={() => {
          onModeChange(isSignup ? "login" : "signup");
          setError("");
          setNotice("");
          setStatus("idle");
        }}
      >
        {isSignup
          ? "Already have an account? Log in"
          : "New here? Create an account"}
      </button>
    </form>
  );
}

export default AuthForm;
