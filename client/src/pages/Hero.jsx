import { useState } from "react";
import WebGLShader from "../components/WebGLShader";
import PrismModel from "../components/PrismModel";
import AuthModal from "../components/AuthModal";

function Hero() {
  const [authMode, setAuthMode] = useState(null);

  return (
    <div className="hero-page">
      <section className="hero-content">
        <WebGLShader />

        <div className="hero-content-inner">
          <h1 className="hero-title">Prysm</h1>
          <p className="hero-tagline">
            Curated depth and live discovery, in one place worth coming back to.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="hero-button hero-button-primary"
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="hero-button hero-button-secondary"
              onClick={() => setAuthMode("login")}
            >
              Log In
            </button>
          </div>
          <div className="hero-scroll-cue" aria-hidden="true" />
        </div>
      </section>

      <section className="hero-model-section">
        <div className="hero-model-viewport">
          <PrismModel />
        </div>
        <div className="hero-model-copy">
          <h2>Any topic, worth exploring</h2>
          <p>
            Prysm blends hand-curated learning paths with live results pulled from
            across the web — articles, papers, videos, code — sorted by what they
            actually are, not where they came from.
          </p>
        </div>
      </section>

      <AuthModal
        open={authMode !== null}
        initialMode={authMode || "login"}
        onClose={() => setAuthMode(null)}
      />
    </div>
  );
}

export default Hero;
