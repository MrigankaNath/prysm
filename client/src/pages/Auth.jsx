import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";

function Auth() {
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="auth-brand">
          Prysm
        </Link>

        <h1 className="auth-title">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="auth-sub">
          {mode === "signup"
            ? "Start building a feed worth returning to."
            : "Pick up where you left off."}
        </p>

        <AuthForm
          mode={mode}
          onModeChange={setMode}
          onSuccess={() => navigate("/")}
        />
      </div>
    </div>
  );
}

export default Auth;
