import { useState, useEffect } from "react";

const SUGGESTED_TOPICS = [
  "Astrophysics",
  "Machine Learning",
  "Web Development",
  "Philosophy",
  "History",
  "Psychology",
  "Startups",
  "Climate Science",
  "Mathematics",
  "Health & Fitness",
];

const DISMISS_KEY = "prysm_onboarding_dismissed";

function OnboardingModal({ session, onInterestsChanged }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [customTopic, setCustomTopic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session || sessionStorage.getItem(DISMISS_KEY)) {
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/interests`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((interests) => {
        if (interests.length === 0) setOpen(true);
      });
  }, [session]);

  const toggleTopic = (topic) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const addCustomTopic = (e) => {
    e.preventDefault();
    const trimmed = customTopic.trim();
    if (!trimmed) return;
    setSelected((prev) => new Set(prev).add(trimmed));
    setCustomTopic("");
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const finish = async () => {
    if (selected.size === 0) return;

    setSaving(true);
    await Promise.all(
      Array.from(selected).map((topic) =>
        fetch(`${import.meta.env.VITE_API_URL}/api/interests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ topic: topic.toLowerCase() }),
        }),
      ),
    );
    setSaving(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    onInterestsChanged();
  };

  if (!open) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2>What are you into?</h2>
        <p className="onboarding-subtitle">
          Pick a few topics to shape your feed — or skip and explore first.
        </p>

        <div className="onboarding-chips">
          {SUGGESTED_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              className={`onboarding-chip${selected.has(topic) ? " selected" : ""}`}
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </button>
          ))}
          {Array.from(selected)
            .filter((topic) => !SUGGESTED_TOPICS.includes(topic))
            .map((topic) => (
              <button
                key={topic}
                type="button"
                className="onboarding-chip selected"
                onClick={() => toggleTopic(topic)}
              >
                {topic}
              </button>
            ))}
        </div>

        <form className="onboarding-custom" onSubmit={addCustomTopic}>
          <input
            type="text"
            placeholder="Or type any other topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={dismiss}>
            Skip for now
          </button>
          <button
            type="button"
            className="onboarding-finish"
            onClick={finish}
            disabled={saving || selected.size === 0}
          >
            {saving ? "Saving..." : "Get started"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
