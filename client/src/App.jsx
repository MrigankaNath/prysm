import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Feed from "./pages/Feed";
import Prisms from "./pages/Prisms";
import PrismDetail from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import Wavelength from "./pages/Wavelength";
import Auth from "./pages/Auth";
import CommandPalette from "./components/CommandPalette";
import OnboardingModal from "./components/OnboardingModal";

const Hero = lazy(() => import("./pages/Hero"));

function AppNav({ hidden }) {
  if (hidden) return null;

  return (
    <nav>
      <span>Prysm</span>
      <Link to="/">Feed</Link>
      <Link to="/prisms">Prisms</Link>
      <Link to="/spectrum">Spectrum</Link>
      <Link to="/wavelength">Wavelength</Link>
      <span className="command-hint">⌘K to search</span>
    </nav>
  );
}

function AppRoutes({ session, interestsVersion }) {
  const location = useLocation();
  const showingHero = !session && location.pathname === "/";

  return (
    <>
      <AppNav hidden={showingHero} />

      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <Feed session={session} interestsVersion={interestsVersion} />
            ) : (
              <Suspense fallback={null}>
                <Hero />
              </Suspense>
            )
          }
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
    </>
  );
}

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
      <CommandPalette />
      <OnboardingModal
        session={session}
        onInterestsChanged={() => setInterestsVersion((v) => v + 1)}
      />

      <AppRoutes session={session} interestsVersion={interestsVersion} />
    </BrowserRouter>
  );
}

export default App;
