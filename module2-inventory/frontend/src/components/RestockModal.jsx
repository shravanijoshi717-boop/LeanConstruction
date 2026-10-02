import React, { useState } from "react";
import "./Modals.css";

export default function RestockModal({ isOpen, bundle, onClose, onConfirmRestock }) {
  const [qtyToAdd, setQtyToAdd] = useState(10);
  const [operator, setOperator] = useState("Store Manager - Site Yard");
  const [notes, setNotes] = useState("Restock batch delivery received");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !bundle) return null;

  const current = bundle.current_quantity;
  const newTotal = current + (parseInt(qtyToAdd) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const count = parseInt(qtyToAdd);
    if (!count || count <= 0) return;

    setIsSubmitting(true);
    await onConfirmRestock({
      tag_id: bundle.tag_id,
      bundle_id: bundle.bundle_id,
      qty_added: count,
      performed_by: operator || "Store Manager",
      notes: notes || "Restock shipment added"
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Restock Material Bundle</h3>
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
                <label className="field-label">Current Stock</label>
                <div style={{ padding: "0.55rem 0.85rem", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-md)", fontWeight: 700 }} className="font-mono">
                  {current} units
                </div>
              </div>
              <div className="modal-field">
                <label className="field-label">Units to Add *</label>
                <input 
                  type="number"
                  min="1"
                  className="field-input font-mono"
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Restock Math */}
            <div style={{ background: "rgba(0,0,0,0.35)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-card)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>New Total Balance:</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.2rem", color: "#34d399" }} className="font-mono">
                {current} + {qtyToAdd || 0} = {newTotal} units
              </div>
            </div>

            <div className="modal-field">
              <label className="field-label">Received By</label>
              <input 
                type="text"
                className="field-input"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                required
              />
            </div>

            <div className="modal-field">
              <label className="field-label">Supplier / Invoice Notes</label>
              <input 
                type="text"
                className="field-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" style={{ background: "#10b981" }} disabled={isSubmitting}>
              {isSubmitting ? "Restocking..." : `Add ${qtyToAdd} Units`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
