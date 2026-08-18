import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Feed from "./pages/Feed";
import Prisms from "./pages/Prisms";
import PrismDetail from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import Wavelength from "./pages/Wavelength";
import Auth from "./pages/Auth";
import CommandPalette from "./components/CommandPalette";
import OnboardingModal from "./components/OnboardingModal";
import {
  IconFeed,
  IconPrism,
  IconSpectrum,
  IconWavelength,
  IconSearch,
} from "./components/Icons";

const Hero = lazy(() => import("./pages/Hero"));

const isMac =
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(
    navigator.userAgentData?.platform || navigator.platform || "",
  );

const NAV_LINKS = [
  { to: "/", label: "Feed", Icon: IconFeed, end: true },
  { to: "/prisms", label: "Prisms", Icon: IconPrism },
  { to: "/spectrum", label: "Spectrum", Icon: IconSpectrum },
];

const navLinkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function AppNav({ hidden, onOpenSearch }) {
  if (hidden) return null;

  return (
    <nav>
      <span className="nav-brand">Prysm</span>

      <button
        type="button"
        className="command-hint"
        onClick={onOpenSearch}
        aria-label="Search"
      >
        <IconSearch className="command-hint-icon" />
        <span className="command-hint-keys">{isMac ? "⌘K" : "Ctrl K"}</span>
      </button>

      <div className="nav-links">
        {NAV_LINKS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} title={label}>
            <Icon className="nav-icon" />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}

        <NavLink to="/wavelength" className={navLinkClass} title="Wavelength">
          <IconWavelength className="nav-icon" />
          <span className="nav-label">Wavelength</span>
        </NavLink>
      </div>
    </nav>
  );
}

function AppRoutes({ session, interestsVersion, onOpenSearch }) {
  const location = useLocation();
  const showingHero = !session && location.pathname === "/";

  return (
    <>
      <AppNav hidden={showingHero} onOpenSearch={onOpenSearch} />

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
  const [paletteOpen, setPaletteOpen] = useState(false);

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
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
      <OnboardingModal
        session={session}
        onInterestsChanged={() => setInterestsVersion((v) => v + 1)}
      />

      <AppRoutes
        session={session}
        interestsVersion={interestsVersion}
        onOpenSearch={() => setPaletteOpen(true)}
      />
    </BrowserRouter>
  );
}

export default App;
