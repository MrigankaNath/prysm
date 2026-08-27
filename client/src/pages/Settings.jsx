import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { clearLibrary, getStats } from "../lib/library";
import { apiJson } from "../lib/api";

const SECTIONS = [
  { id: "account", label: "Account" },
  { id: "premium", label: "Premium" },
  { id: "preferences", label: "Preferences" },
];

// Mirrors §8 step 17 in the PRD — stored locally until GET/PUT /api/preferences
// exists, so the control is real but the persistence is not yet server-side.
const DEPTH_OPTIONS = [
  { id: "grounded", label: "Stay grounded", hint: "Favour intros and overviews" },
  { id: "balanced", label: "Balanced", hint: "A mix across depth levels" },
  { id: "push", label: "Push me", hint: "Lean into papers and advanced material" },
];

const DEPTH_KEY = "prysm.depthPreference";

function AccountSection({ session }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const email = session?.user?.email || "";

  return (
    <>
      <h2 className="set-heading">Personal info</h2>

      <label className="set-label" htmlFor="first-name">
        First name
      </label>
      <input
        id="first-name"
        className="set-input"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Your first name"
      />

      <label className="set-label" htmlFor="last-name">
        Last name
      </label>
      <input
        id="last-name"
        className="set-input"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Your last name"
      />

      <button
        type="button"
        className="set-button-wide"
        disabled={!firstName.trim() && !lastName.trim()}
      >
        Update personal info
      </button>

      <div className="set-divider" />

      <h2 className="set-heading">Email address</h2>
      {email ? (
        <div className="set-email-row">
          <span className="set-email">{email}</span>
        </div>
      ) : (
        <p className="set-empty">
          You&rsquo;re signed out.{" "}
          <Link to="/auth" className="inline-link">
            Log in
          </Link>{" "}
          to manage your account.
        </p>
      )}
    </>
  );
}

/* What the month has actually cost, in the only unit that costs anything: a
   topic nobody had explored before. Re-opening a topic someone else has
   already searched is free and uncounted, which is the part worth saying out
   loud — otherwise the number looks far more restrictive than it is. */
function UsageMeter() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    let live = true;
    apiJson("/api/usage", null).then((data) => live && setUsage(data));
    return () => {
      live = false;
    };
  }, []);

  if (!usage) return null;

  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const low = usage.remaining <= Math.max(3, usage.limit * 0.2);
  /* The bar is a scarcity cue, and showing one from the first search makes a
     cap nobody is near feel like a cap. It appears once a quarter of the
     month's allowance is gone; before that the sentence alone is enough. */
  const showBar = pct >= 25;

  return (
    <>
      <h2 className="set-heading">Your plan</h2>
      <p className="set-note">
        Reading, saving, your feed, Prisms and every topic already in Prysm are
        <strong> unlimited</strong> — however much you use them.
      </p>

      <div className="usage-meter">
        <div className="set-email-row">
          <span className="set-email">
            {usage.remaining} new topics left this month
          </span>
          <span className="set-note">
            {usage.used} of {usage.limit} used
          </span>
        </div>

        {showBar && (
          <div className="usage-bar">
            <div
              className={`usage-fill${low ? " low" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <p className="usage-note">
          A topic only counts the <strong>first time anyone searches it</strong>,
          because that is when Prysm has to go and find it. After that it is in
          the library and free for everyone, forever. Resets on the 1st.
        </p>
      </div>
      <div className="set-divider" />
    </>
  );
}

function PremiumSection() {
  return (
    <>
      <UsageMeter />

      <h2 className="set-heading">Premium</h2>
      <div className="set-premium-card">
        <h3 className="set-premium-title">Unlock every Prism</h3>
        <p className="set-premium-copy">
          Curated learning paths, 400 new topics a month instead of 40, and
          depth calibration tuned to what you already know.
        </p>
        <button type="button" className="set-premium-cta">
          Explore Premium
        </button>
      </div>
      <p className="set-note">
        No billing is wired up yet — this is the placeholder surface for it.
      </p>
    </>
  );
}

function PreferencesSection() {
  const [depth, setDepth] = useState(
    () => localStorage.getItem(DEPTH_KEY) || "balanced",
  );
  const [cleared, setCleared] = useState(false);
  const stats = getStats();

  const chooseDepth = (id) => {
    setDepth(id);
    localStorage.setItem(DEPTH_KEY, id);
  };

  const handleClear = () => {
    clearLibrary();
    setCleared(true);
  };

  return (
    <>
      <h2 className="set-heading">Depth preference</h2>
      <p className="set-note">
        Biases how much advanced material surfaces in your feed.
      </p>
      <div className="set-option-list">
        {DEPTH_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`set-option${depth === option.id ? " selected" : ""}`}
            onClick={() => chooseDepth(option.id)}
          >
            <span className="set-option-radio" />
            <span className="set-option-body">
              <span className="set-option-label">{option.label}</span>
              <span className="set-option-hint">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="set-divider" />

      <h2 className="set-heading">Your library</h2>
      <p className="set-note">
        {stats.bookmarks} saved, {stats.history} opened, and {stats.topics}{" "}
        topic{stats.topics === 1 ? "" : "s"} explored — all stored on this
        device.
      </p>
      <button type="button" className="set-danger" onClick={handleClear}>
        {cleared ? "Cleared" : "Clear library"}
      </button>
    </>
  );
}

function Settings({ session }) {
  const [active, setActive] = useState("account");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Signing out drops `session`, so "/" renders the Hero rather than the Feed.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="page page-wide settings">
      <div className="set-layout">
        <aside className="set-sidebar">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`set-nav${active === section.id ? " active" : ""}`}
              onClick={() => setActive(section.id)}
            >
              {section.label}
            </button>
          ))}

          {session && (
            <button type="button" className="set-nav set-nav-out" onClick={handleLogout}>
              Log out
            </button>
          )}
        </aside>

        <div className="set-panel">
          {active === "account" && <AccountSection session={session} />}
          {active === "premium" && <PremiumSection />}
          {active === "preferences" && <PreferencesSection />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
