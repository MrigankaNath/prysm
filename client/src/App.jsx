import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Feed from "./pages/Feed";
import Prisms from "./pages/Prisms";
import PrismDetail from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import Wavelength from "./pages/Wavelength";
import Auth from "./pages/Auth";
import CommandPalette from "./components/CommandPalette";
import OnboardingModal from "./components/OnboardingModal";

function App() {
  const [session, setSession] = useState(null);
  const [interestsVersion, setInterestsVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <nav>
        <span>Prysm</span>
        <Link to="/">Feed</Link>
        <Link to="/prisms">Prisms</Link>
        <Link to="/spectrum">Spectrum</Link>
        <Link to="/wavelength">Wavelength</Link>
        <span className="command-hint">⌘K to search</span>
      </nav>

      <CommandPalette />
      <OnboardingModal
        session={session}
        onInterestsChanged={() => setInterestsVersion((v) => v + 1)}
      />

      <Routes>
        <Route
          path="/"
          element={<Feed session={session} interestsVersion={interestsVersion} />}
        />
        <Route
          path="/prisms"
          element={<Prisms session={session} interestsVersion={interestsVersion} />}
        />
        <Route path="/prisms/:id" element={<PrismDetail />} />
        <Route path="/spectrum" element={<Spectrum />} />
        <Route path="/wavelength" element={<Wavelength session={session} />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
