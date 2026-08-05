import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Feed from "./pages/Feed";
import Prisms from "./pages/Prisms";
import PrismDetail from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import Wavelength from "./pages/Wavelength";
import Auth from "./pages/Auth";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <span>Prysm</span>
        <Link to="/">Feed</Link>
        <Link to="/prisms">Prisms</Link>
        <Link to="/spectrum">Spectrum</Link>
        <Link to="/wavelength">Wavelength</Link>
        <Link to="/auth">Log In</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/prisms" element={<Prisms />} />
        <Route path="/prisms/:id" element={<PrismDetail />} />
        <Route path="/spectrum" element={<Spectrum />} />
        <Route path="/wavelength" element={<Wavelength />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
