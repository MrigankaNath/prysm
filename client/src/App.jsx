import { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import Feed from "./pages/Feed";
import ExploreTopic from "./pages/ExploreTopic";
import Prisms from "./pages/Prisms";
import PrismDetail from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import Wavelength from "./pages/Wavelength";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import CommandPalette from "./components/CommandPalette";
import NavMenu from "./components/NavMenu";
import {
  IconFeed,
  IconPrism,
  IconSpectrum,
  IconWavelength,
  IconSearch,
  PrismGradientDefs,
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

function AppNav({ hidden, onOpenSearch, session }) {
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

        <NavMenu session={session} />
      </div>
    </nav>
  );
}

/* Everything except the landing page and /auth is behind the session.
 *
 * `authReady` matters more than it looks: supabase.auth.getSession() is async,
 * so `session` is null for the first tick of every page load. Redirecting on
 * that would bounce a signed-in user off /prisms every time they refreshed.
 * Render nothing until the session is actually known.
 *
 * This is a client-side gate over a public API — /api/bundles and friends still
 * answer unauthenticated requests. It controls the product surface, not the
 * data; locking the data down is separate server work.
 */
function RequireSession({ session, authReady, children }) {
  if (!authReady) return null;
  if (!session) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ session, authReady, onOpenSearch }) {
  const location = useLocation();
  const showingHero = !session && location.pathname === "/";

  const gated = (element) => (
    <RequireSession session={session} authReady={authReady}>
      {element}
    </RequireSession>
  );

  return (
    <>
      <AppNav hidden={showingHero} onOpenSearch={onOpenSearch} session={session} />

      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <Feed session={session} />
            ) : (
              <Suspense fallback={null}>
                <Hero />
              </Suspense>
            )
          }
        />
        <Route path="/prisms" element={gated(<Prisms session={session} />)} />
        <Route path="/explore/:topic" element={gated(<ExploreTopic />)} />
        <Route path="/prisms/:id" element={gated(<PrismDetail />)} />
        <Route path="/spectrum" element={gated(<Spectrum />)} />
        <Route
          path="/wavelength"
          element={gated(<Wavelength session={session} />)}
        />
        <Route
          path="/settings"
          element={gated(<Settings session={session} />)}
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <PrismGradientDefs />
      {session && <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />}
      <AppRoutes
        session={session}
        authReady={authReady}
        onOpenSearch={() => setPaletteOpen(true)}
      />
    </BrowserRouter>
  );
}

export default App;
