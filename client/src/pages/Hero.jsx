import { useNavigate } from "react-router-dom";
import WebGLShader from "../components/WebGLShader";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero-page">
      <WebGLShader />
      <div className="hero-content">
        <h1 className="hero-title">Prysm</h1>
        <p className="hero-tagline">
          Curated depth and live discovery, in one place worth coming back to.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="hero-button hero-button-primary"
            onClick={() => navigate("/auth")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className="hero-button hero-button-secondary"
            onClick={() => navigate("/auth")}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
