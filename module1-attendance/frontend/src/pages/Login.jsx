import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const fillDemoUser = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("test123456");
    setError(null);
  };

  return (
    <div className="login-page">
      {/* Desktop & Mobile Hero Panel */}
      <div className="login-hero-panel">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <div className="brand-header">
            <div className="brand-mark">LC</div>
            <div className="brand-text">
              <h1>Lean Construction</h1>
              <p>Workforce Attendance</p>
            </div>
          </div>
          <div className="hero-copy">
            <h2>Real-time site attendance tracking.</h2>
            <p>
              Automated fingerprint check-in with live operational dashboards 
              for contractors, supervisors, and workers.
            </p>
          </div>
          <div className="hero-footer">
            <span>Powered by Lean Construction OS</span>
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Select a demo role or enter your credentials</p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Quick Tap-to-Fill Demo Roles */}
          <div className="quick-roles">
            <span className="quick-roles-title">One-tap Demo Fill:</span>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${email === "contractor@test.com" ? "active" : ""}`}
                onClick={() => fillDemoUser("contractor@test.com")}
              >
                Contractor
              </button>
              <button
                type="button"
                className={`role-btn ${email === "supervisor@test.com" ? "active" : ""}`}
                onClick={() => fillDemoUser("supervisor@test.com")}
              >
                Supervisor
              </button>
              <button
                type="button"
                className={`role-btn ${email === "worker1@test.com" ? "active" : ""}`}
                onClick={() => fillDemoUser("worker1@test.com")}
              >
                Worker
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>

          <div className="demo-hint">
            <span>Demo password: <code>test123456</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
