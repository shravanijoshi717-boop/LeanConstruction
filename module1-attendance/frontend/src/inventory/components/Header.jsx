import React from "react";
import "./Header.css";

export default function Header({ 
  user,
  userProfile,
  onLogout,
  isConnectedToDb, 
  onOpenAddModal, 
  onOpenSqlModal,
  onResetDemoData 
}) {
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const roleName = userProfile?.role || user?.user_metadata?.role || "supervisor";

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Brand & Module Indicator */}
        <div className="header-brand-group">
          <div className="brand-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="brand-titles">
            <div className="brand-main-row">
              <span className="brand-main">Lean Construction</span>
            </div>
            <span className="brand-sub">RFID Material & Bundle Inventory System</span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="header-actions">


          <button 
            className="btn-header-primary" 
            onClick={onOpenAddModal}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Register Bundle</span>
          </button>

          {/* User profile & Logout */}
          <div className="user-profile-header">
            <div className="user-avatar" title={displayName}>
              {displayName[0].toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="user-display-name">{displayName}</span>
              <span className={`user-role-badge ${roleName}`}>{roleName}</span>
            </div>
            <button className="btn-logout" onClick={onLogout} title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
