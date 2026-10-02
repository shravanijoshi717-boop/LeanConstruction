import React, { useState } from "react";
import "./Modals.css";

export default function RemovalModal({ isOpen, bundle, onClose, onConfirmRemoval }) {
  const [qty, setQty] = useState(1);
  const [operator, setOperator] = useState("Field Operator - Site Bay 1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !bundle) return null;

  const current = bundle.current_quantity;
  const remaining = Math.max(0, current - (parseInt(qty) || 0));
  const willBeLow = remaining > 0 && remaining <= bundle.minimum_quantity;
  const willBeOut = remaining === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const removeCount = parseInt(qty);
    if (!removeCount || removeCount <= 0) return;
    if (removeCount > current) {
      alert(`Cannot remove ${removeCount} units. Only ${current} available!`);
      return;
    }

    setIsSubmitting(true);
    await onConfirmRemoval({
      tag_id: bundle.tag_id,
      bundle_id: bundle.bundle_id,
      qty_removed: removeCount,
      performed_by: operator || "Field Operator",
      notes: notes || "Direct table removal entry"
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Record Material / Item Removal</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {bundle.bundle_id} ({bundle.material_type || bundle.pipe_type})
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-form-grid">
              <div className="modal-field">
                <label className="field-label">Current Stock Available</label>
                <div style={{ padding: "0.55rem 0.85rem", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-md)", fontWeight: 700 }} className="font-mono text-cyan">
                  {current} units
                </div>
              </div>
              <div className="modal-field">
                <label className="field-label">Minimum Safety Threshold</label>
                <div style={{ padding: "0.55rem 0.85rem", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-md)", fontWeight: 700 }} className="font-mono text-amber">
                  {bundle.minimum_quantity} units
                </div>
              </div>
            </div>

            <div className="modal-field">
              <label className="field-label">Quantity to Remove *</label>
              <input 
                type="number"
                min="1"
                max={current}
                className="field-input font-mono"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>

            {/* Dynamic Calculation preview */}
            <div style={{ background: "rgba(0,0,0,0.35)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-card)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Calculated Balance:</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.2rem" }} className="font-mono">
                {current} − {qty || 0} = <span style={{ color: willBeOut ? "#ef4444" : willBeLow ? "#f59e0b" : "#10b981" }}>{remaining} units</span>
              </div>
              {willBeOut && (
                <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem", fontWeight: 600 }}>
                  🚨 Warning: Bundle will be completely OUT OF STOCK!
                </div>
              )}
              {willBeLow && (
                <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem", fontWeight: 600 }}>
                  ⚠️ Warning: Will trigger LOW STOCK ALERT (≤ {bundle.minimum_quantity} units)!
                </div>
              )}
            </div>

            <div className="modal-field">
              <label className="field-label">Operator / Receiver</label>
              <input 
                type="text"
                className="field-input"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                required
              />
            </div>

            <div className="modal-field">
              <label className="field-label">Job Notes / Purpose</label>
              <input 
                type="text"
                className="field-input"
                placeholder="e.g. Site installation or foundation work"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit danger" disabled={isSubmitting || current === 0}>
              {isSubmitting ? "Deducting..." : `Deduct ${qty} Units`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
