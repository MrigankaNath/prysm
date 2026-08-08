import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Wavelength({ session }) {
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
      <p>Logged in as {session.user.email}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Wavelength;
