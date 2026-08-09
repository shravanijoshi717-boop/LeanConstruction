import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Layout.css";

export default function Layout({ user, userProfile, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="app-logo">
              <span className="logo-badge">LC</span>
              <span className="logo-title">Attendance</span>
            </div>
            <div className="nav-divider" />
            <div className="role-pill">
              <span className="role-dot" />
              <span className="role-text">{userProfile?.role || "User"} View</span>
            </div>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="avatar">
                {(userProfile?.full_name || user.email)[0].toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{userProfile?.full_name || user.email}</span>
                <span className="user-role-label">{userProfile?.role}</span>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout} title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="logout-text">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-viewport">
        {children}
      </main>
    </div>
  );
}
