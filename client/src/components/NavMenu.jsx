import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { IconMenu, IconSettings, IconLogout } from "./Icons";

function NavMenu({ session }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="nav-menu" ref={wrapperRef}>
      <button
        type="button"
        className={`nav-menu-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
      >
        <IconMenu className="nav-menu-icon" />
      </button>

      {open && (
        <div className="nav-menu-panel" role="menu">
          <button
            type="button"
            className="nav-menu-item"
            role="menuitem"
            onClick={() => go("/settings")}
          >
            <IconSettings className="nav-menu-item-icon" />
            Settings
          </button>

          <div className="nav-menu-divider" />

          {session ? (
            <button
              type="button"
              className="nav-menu-item"
              role="menuitem"
              onClick={handleLogout}
            >
              <IconLogout className="nav-menu-item-icon" />
              Log out
            </button>
          ) : (
            <button
              type="button"
              className="nav-menu-item"
              role="menuitem"
              onClick={() => go("/auth")}
            >
              <IconLogout className="nav-menu-item-icon" />
              Log in
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NavMenu;
