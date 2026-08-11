import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./EditAttendanceModal.css";

export default function EditAttendanceModal({
  isOpen,
  onClose,
  record,
  users = [],
  onRecordUpdated,
}) {
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [status, setStatus] = useState("present");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && record) {
      // Format ISO string to datetime-local string (YYYY-MM-DDTHH:mm)
      const toLocalDatetime = (ts) => {
        if (!ts) return "";
        const d = new Date(ts);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setCheckInTime(toLocalDatetime(record.check_in));
      setCheckOutTime(toLocalDatetime(record.check_out));
      setStatus((record.status || "present").toLowerCase());
      setReason("");
      setError(null);
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const user = users.find((u) => u.id === record.user_id);
  const workerName = user?.full_name || "Worker";

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Reason for edit is mandatory.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const checkInIso = checkInTime ? new Date(checkInTime).toISOString() : record.check_in;
      const checkOutIso = checkOutTime ? new Date(checkOutTime).toISOString() : null;

      const { data, error: rpcError } = await supabase.rpc("edit_attendance_record", {
        p_attendance_id: record.id,
        p_check_in: checkInIso,
        p_check_out: checkOutIso,
        p_status: status,
        p_reason: reason.trim(),
      });

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      if (onRecordUpdated) {
        onRecordUpdated({
          ...record,
          check_in: checkInIso,
          check_out: checkOutIso,
          status: status,
          is_manually_edited: true,
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled = loading || !reason.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Edit Attendance Record</h3>
            <p>Manual correction with required audit justification</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSave}>
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

          {/* Worker Info Read-only */}
          <div className="edit-worker-banner">
            <span className="edit-worker-avatar">{workerName[0]}</span>
            <div className="edit-worker-meta">
              <span className="edit-worker-name">{workerName}</span>
              <span className="edit-device-badge">
                Scanner: <code>{record.device_id || "esp32-gate-1"}</code>
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="editCheckIn">Check-In Time *</label>
              <input
                id="editCheckIn"
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="editCheckOut">Check-Out Time (Optional)</label>
              <input
                id="editCheckOut"
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="editStatus">Attendance Status *</label>
            <select
              id="editStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="present">Present (On Time)</option>
              <option value="late">Late Arrival</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="editReason">
              Reason for Edit * <span className="required-tag">(Mandatory)</span>
            </label>
            <textarea
              id="editReason"
              rows="3"
              placeholder="e.g. Fingerprint scanner malfunction at gate 1, worker checked in manually"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSaveDisabled}
              title={!reason.trim() ? "Please enter a reason to save" : ""}
            >
              {loading ? <span className="btn-spinner" /> : "Save Correction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
