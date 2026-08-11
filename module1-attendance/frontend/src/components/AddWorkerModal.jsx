import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./AddWorkerModal.css";

export default function AddWorkerModal({
  isOpen,
  onClose,
  onWorkerAdded,
  existingUsers = [],
  currentUserRole = "contractor",
  currentUserId,
  contractorId,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("welcome123");
  const [role, setRole] = useState("worker");
  const [fingerprintId, setFingerprintId] = useState("");
  const [createLogin, setCreateLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const isSupervisor = currentUserRole === "supervisor";
  const activeContractorId = contractorId || currentUserId;

  useEffect(() => {
    if (isOpen) {
      const existingIds = existingUsers
        .map((u) => u.fingerprint_id)
        .filter((id) => id !== null && id !== undefined && !isNaN(id));

      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      setFingerprintId(nextId.toString());
      setFullName("");
      setEmail("");
      setPassword("welcome123");
      setRole("worker");
      setCreateLogin(false);
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWebAccount = role === "supervisor" || createLogin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    if (!fullName.trim()) {
      setError("Please enter worker full name.");
      setLoading(false);
      return;
    }

    const fpId = parseInt(fingerprintId, 10);
    if (isNaN(fpId) || fpId < 1) {
      setError("Please enter a valid numeric fingerprint slot ID (1 or greater).");
      setLoading(false);
      return;
    }

    const assignedRole = isSupervisor ? "worker" : role;

    try {
      let userId = crypto.randomUUID();

      if (isWebAccount) {
        if (!email.trim()) {
          setError("Email address is required to create a web portal login account.");
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim() || "welcome123",
          options: {
            data: {
              full_name: fullName.trim(),
              role: assignedRole,
              contractor_id: activeContractorId,
            },
          },
        });

        if (authError) {
          setError(`Auth signup error: ${authError.message}`);
          setLoading(false);
          return;
        }

        if (authData?.user) {
          userId = authData.user.id;
          await supabase
            .from("users")
            .update({
              fingerprint_id: fpId,
              role: assignedRole,
              contractor_id: activeContractorId,
            })
            .eq("id", userId);
        }
      } else {
        const newWorkerData = {
          id: userId,
          full_name: fullName.trim(),
          role: assignedRole,
          fingerprint_id: fpId,
          contractor_id: activeContractorId,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from("users")
          .insert(newWorkerData);

        if (insertError) {
          if (insertError.message.includes("fingerprint_id") || insertError.message.includes("duplicate")) {
            setError(`Fingerprint ID #${fpId} is already assigned to another worker.`);
          } else {
            setError(insertError.message);
          }
          setLoading(false);
          return;
        }
      }

      const createdUser = {
        id: userId,
        full_name: fullName.trim(),
        role: assignedRole,
        fingerprint_id: fpId,
        contractor_id: activeContractorId,
        email: isWebAccount ? email.trim() : null,
        password: isWebAccount ? (password.trim() || "welcome123") : null,
      };

      setSuccessInfo(createdUser);
      onWorkerAdded(createdUser);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to register member.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Register Team Member</h3>
            <p>Onboard site workers or supervisors to your company</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {successInfo ? (
          <div className="success-banner">
            <div className="success-icon">✅</div>
            <div className="success-body">
              <h4>{successInfo.role === "supervisor" ? "Supervisor Registered!" : "Worker Registered!"}</h4>
              <p>
                <b>{successInfo.full_name}</b> has been onboarded as <b>{successInfo.role.toUpperCase()}</b>.
              </p>

              {successInfo.email ? (
                <div className="credentials-box">
                  <b>🔑 Web Login Credentials:</b><br />
                  <span>Email: <code>{successInfo.email}</code></span><br />
                  <span>Temporary Password: <code>{successInfo.password}</code></span>
                </div>
              ) : (
                <div className="next-step-box">
                  <b>📌 Action Required on Site:</b><br />
                  Enroll finger slot <b>#{successInfo.fingerprint_id}</b> on the physical R307 sensor for {successInfo.full_name}.
                </div>
              )}
            </div>
            <button className="btn-done" onClick={onClose} style={{ marginTop: "1rem" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" />
                  <line x1="12" y1="16" x2="12.01" />
                </svg>
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Ramesh Verma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="role">Assigned Role</label>
                {isSupervisor ? (
                  <input
                    type="text"
                    value="Worker"
                    disabled
                    className="read-only-role"
                    title="Supervisors can only onboard Workers"
                  />
                ) : (
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setRole(newRole);
                      if (newRole === "supervisor") {
                        setCreateLogin(true);
                      }
                    }}
                  >
                    <option value="worker">Worker (Site Member)</option>
                    <option value="supervisor">Supervisor (Web Access Required)</option>
                  </select>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fingerprintId">Assigned Fingerprint Slot ID *</label>
                <input
                  id="fingerprintId"
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Optional Login Toggle Checkbox for Workers */}
            {role === "worker" && (
              <div className="create-login-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createLogin}
                    onChange={(e) => setCreateLogin(e.target.checked)}
                  />
                  <span className="checkbox-custom" />
                  <div className="checkbox-text">
                    <strong>Also create web dashboard login for this worker?</strong>
                    <p>Gives worker access to their personal portal via email & password</p>
                  </div>
                </label>
              </div>
            )}

            {/* Web Credentials Fields */}
            {isWebAccount && (
              <div className="web-login-section">
                <div className="web-login-title">🔑 Web Portal Credentials</div>

                <div className="form-field">
                  <label htmlFor="email">Work Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="worker@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="password">Temporary Initial Password</label>
                  <input
                    id="password"
                    type="text"
                    placeholder="welcome123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {role === "worker" && !createLogin && (
              <div className="modal-hint">
                <span>
                  💡 <b>Scan-Only Worker:</b> Does not require web login. Enrolls finger slot <b>#{fingerprintId || "?"}</b> on physical R307 sensor.
                </span>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : "Register Member"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
