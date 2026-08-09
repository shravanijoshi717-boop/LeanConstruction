import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./AddWorkerModal.css";

export default function AddWorkerModal({ isOpen, onClose, onWorkerAdded, existingUsers = [] }) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("worker");
  const [fingerprintId, setFingerprintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Find highest existing fingerprint_id and suggest the next one
      const existingIds = existingUsers
        .map((u) => u.fingerprint_id)
        .filter((id) => id !== null && id !== undefined && !isNaN(id));

      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      setFingerprintId(nextId.toString());
      setFullName("");
      setRole("worker");
      setError(null);
    }
  }, [isOpen, existingUsers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const newUserId = crypto.randomUUID();

      const { data, error: insertError } = await supabase
        .from("users")
        .insert({
          id: newUserId,
          full_name: fullName.trim(),
          role: role,
          fingerprint_id: fpId,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes("fingerprint_id")) {
          setError(`Fingerprint ID ${fpId} is already assigned to another worker.`);
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      onWorkerAdded(data);
      onClose();
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
            <p>Add worker identity to Supabase before sensor onboarding</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="fullName">Full Name</label>
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
              <label htmlFor="role">Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="fingerprintId">Fingerprint Slot ID</label>
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
              ℹ️ <b>Next step:</b> Enroll finger slot <b>#{fingerprintId || "?"}</b> on the physical R307 sensor for {fullName || "this worker"}.
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Add Worker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
