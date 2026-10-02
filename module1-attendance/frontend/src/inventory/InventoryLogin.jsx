import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import "./InventoryLogin.css";

export default function Login({ onDemoLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("supervisor"); // 'contractor' | 'supervisor'
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim() || "Apex Construction Ltd",
            role: role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        try {
          await supabase
            .from("users")
            .update({ company_name: companyName.trim() || "Apex Construction Ltd", role: role })
            .eq("id", data.user.id);
        } catch (e) {
          // ignore
        }
      }

      setSuccessMsg("Account created! Please check your email to confirm or sign in.");
      setIsSignUp(false);
      setLoading(false);
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
      }
      setLoading(false);
    }
  };

  const handleDemoSignIn = (demoRole) => {
    onDemoLogin({
      id: "demo-" + demoRole + "-1",
      email: demoRole === "contractor" ? "contractor@apex.demo" : "supervisor@apex.demo",
      full_name: demoRole === "contractor" ? "Apex Project Director" : "Site Supervisor Mike",
      role: demoRole,
      company_name: "Apex Construction Ltd",
    });
  };

  return (
    <div className="login-page">
      {/* Left Hero Panel */}
      <div className="login-hero-panel">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="brand-header">
            <div className="brand-mark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>Lean Construction</h1>
              <div className="module-tag">RFID Material Inventory</div>
            </div>
          </div>

          <div className="hero-copy">
            <h2>RFID-Based Material Tracking & Low-Stock Alerts.</h2>
            <p>
              Automated bundle identification, instant physical removal deductions,
              and proactive low-stock alerts for contractors and site supervisors.
            </p>
          </div>

          <div className="hero-footer">
            <a 
              href="/" 
              className="switch-module-hero-btn"
              title="Switch to Attendance Portal"
            >
              <span>⮜ Switch to Attendance Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="login-card-container">
          <div className="form-header">
            <h2>{isSignUp ? "Register Inventory Manager" : "Sign In to Inventory"}</h2>
            <p>
              {isSignUp
                ? "Create your supervisor or contractor credentials"
                : "Enter your authorized credentials to manage material & bundle inventory"}
            </p>
          </div>

          {error && <div className="auth-alert error font-mono">{error}</div>}
          {successMsg && <div className="auth-alert success">{successMsg}</div>}

          <form onSubmit={handleAuth} className="auth-form">
            {isSignUp && (
              <>
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Construction Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="role-select"
                  >
                    <option value="supervisor">Site Supervisor (Field & Inventory)</option>
                    <option value="contractor">Contractor (Full Admin Access)</option>
                  </select>
                </div>
              </>
            )}

            <div className="input-group">
              <label>Work Email</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading}>
              {loading
                ? "Verifying..."
                : isSignUp
                ? "Create Account"
                : "Sign In to Inventory"}
            </button>
          </form>

          {/* 1-Click Fast Demo Sign-In */}
          <div className="demo-section">
            <div className="divider-text">
              <span>OR 1-CLICK DEMO ACCESS</span>
            </div>
            <div className="demo-buttons-grid">
              <button
                type="button"
                className="btn-demo contractor"
                onClick={() => handleDemoSignIn("contractor")}
              >
                <span className="demo-role-badge">Contractor</span>
                <span>Sign in as Admin</span>
              </button>
              <button
                type="button"
                className="btn-demo supervisor"
                onClick={() => handleDemoSignIn("supervisor")}
              >
                <span className="demo-role-badge">Supervisor</span>
                <span>Sign in as Field Lead</span>
              </button>
            </div>
          </div>

          <div className="auth-footer-toggle">
            {isSignUp ? (
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsSignUp(false)}>
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Need a new login?{" "}
                <button type="button" onClick={() => setIsSignUp(true)}>
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
