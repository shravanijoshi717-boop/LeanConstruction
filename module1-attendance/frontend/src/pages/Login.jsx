import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Login.css";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailCheckModal, setShowEmailCheckModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      // Contractor Organization Registration
      if (!companyName.trim()) {
        setError("Please enter your company name.");
        setLoading(false);
        return;
      }

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
            company_name: companyName.trim(),
            role: "contractor",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        await supabase
          .from("users")
          .update({ company_name: companyName.trim() })
          .eq("id", data.user.id);
      }

      setRegisteredEmail(email.trim());
      setShowEmailCheckModal(true);
      setLoading(false);
    } else {
      // Standard Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
      }
      setLoading(false);
    }
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

      {/* Login / Signup Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {/* Sign In / Sign Up Mode Toggle */}
          <div className="auth-tab-group">
            <button
              className={`auth-tab ${!isSignUp ? "active" : ""}`}
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setShowEmailCheckModal(false);
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${isSignUp ? "active" : ""}`}
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setShowEmailCheckModal(false);
              }}
            >
              Contractor Registration
            </button>
          </div>

          <div className="form-header">
            <h2>{isSignUp ? "Register Company" : "Sign in to your account"}</h2>
            <p>
              {isSignUp
                ? "Create a new contractor company account"
                : "Enter your credentials to access your dashboard"}
            </p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {isSignUp && (
              <>
                <div className="field">
                  <label htmlFor="companyName">Company / Organization Name *</label>
                  <input
                    id="companyName"
                    type="text"
                    placeholder="e.g. Apex Construction Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="fullName">Contractor Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Rajesh Patel"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="field">
              <label htmlFor="email">{isSignUp ? "Work Email Address *" : "Email address *"}</label>
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
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                placeholder={isSignUp ? "Choose a secure password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner" />
              ) : isSignUp ? (
                "Create Contractor Account"
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>

          {isSignUp && (
            <div className="demo-hint">
              <span>Supervisors and Workers are onboarded internally by Contractors via dashboard.</span>
            </div>
          )}
        </div>
      </div>

      {/* Check Your Email Popup Modal */}
      {showEmailCheckModal && (
        <div className="modal-backdrop" onClick={() => setShowEmailCheckModal(false)}>
          <div className="modal-content email-check-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-icon">✉️</div>
            <h3>Check your email</h3>
            <p className="email-modal-text">
              We've sent a verification email to:
              <br />
              <strong className="email-highlight">{registeredEmail}</strong>
            </p>
            <p className="email-modal-subtext">
              Click the link in the email to confirm your Contractor account, then return to sign in.
            </p>
            <button
              className="btn-modal-action"
              onClick={() => {
                setShowEmailCheckModal(false);
                setIsSignUp(false);
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
