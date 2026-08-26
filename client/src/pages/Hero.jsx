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
          <p className="hero-proof">
            9 sources · articles, papers, videos, code, podcasts, books
          </p>
          <div className="hero-scroll-cue" aria-hidden="true" />
        </div>
      </section>

      <section className="hero-model-section">
        <div className="hero-model-viewport">
          <PrismModel />
        </div>
        <div className="hero-model-copy">
          <h2>One search. Every kind of answer.</h2>
          <p>
            A prism takes one beam and shows you every colour inside it. Prysm
            does that to a topic — one search, split into articles, papers,
            videos, code, podcasts and discussions, sorted by what each thing
            actually is rather than which site it came from.
          </p>
        </div>
      </section>

      <section className="hero-steps">
        <h2 className="hero-steps-head">How it works</h2>
        <div className="hero-step-grid">
          {[
            {
              n: "01",
              t: "Search anything",
              d: "Any topic, however niche. Nine sources answer at once, and the results are cached per topic so it stays fast and free.",
            },
            {
              n: "02",
              t: "Read it by kind",
              d: "Grouped as articles, videos, papers, code and more — ordered per topic, so code leads for React and podcasts lead for stoicism.",
            },
            {
              n: "03",
              t: "Keep what matters",
              d: "Bookmark anything and it lands in Wavelength. Your feed rebuilds from what you save and search, not from what is trending.",
            },
          ].map((step) => (
            <article key={step.n} className="hero-step">
              <span className="hero-step-n">{step.n}</span>
              <h3 className="hero-step-t">{step.t}</h3>
              <p className="hero-step-d">{step.d}</p>
            </article>
          ))}
        </div>

        {/*  ILLUSTRATION SLOT — landing centrepiece, full-width ~1000x300.
            The most valuable place for a custom piece on the whole site.  */}
        <div className="illo-slot illo-slot-banner" aria-hidden="true">
          <span className="illo-hint">wide illustration — landing centrepiece</span>
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
