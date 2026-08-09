import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Layout.css";

export default function Layout({ user, userProfile, children }) {
  const [companyName, setCompanyName] = useState(userProfile?.company_name || "Apex Construction Ltd");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (userProfile?.company_name) {
      setCompanyName(userProfile.company_name);
      setTempCompanyName(userProfile.company_name);
    }
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!tempCompanyName.trim()) return;

    setSavingCompany(true);
    const updatedName = tempCompanyName.trim();

    const { error } = await supabase
      .from("users")
      .update({ company_name: updatedName })
      .eq("id", userProfile?.id || user.id);

    if (!error) {
      setCompanyName(updatedName);
      setIsEditingCompany(false);
    }
    setSavingCompany(false);
  };

  const isContractor = userProfile?.role === "contractor";

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="app-logo">
              <span className="logo-badge">LC</span>
              <div className="company-title-group">
                {isEditingCompany ? (
                  <form onSubmit={handleSaveCompany} className="company-edit-form">
                    <input
                      type="text"
                      className="company-name-input"
                      value={tempCompanyName}
                      onChange={(e) => setTempCompanyName(e.target.value)}
                      autoFocus
                      required
                    />
                    <button type="submit" className="btn-save-company" disabled={savingCompany}>
                      {savingCompany ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-company"
                      onClick={() => setIsEditingCompany(false)}
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="company-header-title">
                    <div className="company-name-row">
                      <span className="logo-company-name">{companyName}</span>
                      {isContractor && (
                        <button
                          className="btn-edit-company"
                          onClick={() => setIsEditingCompany(true)}
                          title="Edit Company Name"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <span className="logo-subtitle">Attendance Portal</span>
                  </div>
                )}
              </div>
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
