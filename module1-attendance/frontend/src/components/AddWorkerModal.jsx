import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./AddWorkerModal.css";

export default function AddWorkerModal({ isOpen, onClose, onWorkerAdded, existingUsers = [] }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [fingerprintId, setFingerprintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-suggest next available fingerprint_id: MAX(fingerprint_id) + 1
      const existingIds = existingUsers
        .map((u) => u.fingerprint_id)
        .filter((id) => id !== null && id !== undefined && !isNaN(id));

      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      setFingerprintId(nextId.toString());
      setFullName("");
      setEmail("");
      setRole("worker");
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen, existingUsers]);

  if (!isOpen) return null;

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

    try {
      // Use provided email or generate internal site email for auth FK constraint
      const targetEmail = email.trim() || `worker_${fpId}_${Date.now().toString().slice(-4)}@site.internal`;
      const tempPassword = "test" + Math.random().toString(36).slice(-6) + "123";

      // 1. Create Auth account (satisfies users_id_fkey constraint)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: targetEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (authError) {
        setError(`Registration error: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Failed to create user record.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2. Set fingerprint_id on the newly created public.users row
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ fingerprint_id: fpId })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        if (updateError.message.includes("fingerprint_id")) {
          setError(`Fingerprint ID #${fpId} is already assigned to another worker.`);
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      const createdWorker = updatedUser || {
        id: userId,
        full_name: fullName.trim(),
        role: role,
        fingerprint_id: fpId,
      };

      setSuccessInfo(createdWorker);
      onWorkerAdded(createdWorker);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to register worker.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Register New Worker</h3>
            <p>Onboard worker identity and assign fingerprint slot ID</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Post-Submit Confirmation Banner */}
        {successInfo ? (
          <div className="success-banner">
            <div className="success-icon">✅</div>
            <div className="success-body">
              <h4>Worker Successfully Registered!</h4>
              <p>
                <b>{successInfo.full_name}</b> is assigned to <b>Fingerprint Slot #{successInfo.fingerprint_id}</b>.
              </p>
              <div className="next-step-box">
                <b>📌 Action Required on Site:</b><br />
                Enroll finger slot <b>#{successInfo.fingerprint_id}</b> on the physical R307 sensor for {successInfo.full_name}.
              </div>
            </div>
            <button className="btn-done" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
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

            <div className="form-field">
              <label htmlFor="email">
                Email Address <span className="label-optional">(Optional — for Web Portal login)</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="ramesh@company.com (leave blank if scan-only)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="worker">Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="fingerprintId">Assigned Fingerprint ID *</label>
                <input
                  id="fingerprintId"
                  type="number"
                  min="1"
                  placeholder="e.g. 7"
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-hint">
              <span>
                💡 <b>Auto-suggested ID: #{fingerprintId || "?"}</b> (Next available slot). Unique constraint enforced in Supabase.
              </span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : "Register Worker"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
