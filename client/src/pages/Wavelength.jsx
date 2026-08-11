import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Wavelength({ session }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="page">
        <h2>Wavelength</h2>
        <p>Log in to see your personal history and progress.</p>
        <Link to="/auth">Log In</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Wavelength</h2>
      <p>Logged in as {me?.email || session.user.email}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Wavelength;
