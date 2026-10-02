import React, { useState } from "react";
import "./RfidSimulatorWidget.css";

export default function RfidSimulatorWidget({ bundles, onRecordRemoval }) {
  const [selectedTag, setSelectedTag] = useState(bundles[0]?.tag_id || "EPC-PIPE-001");
  const [qtyRemoved, setQtyRemoved] = useState(2);
  const [performer, setPerformer] = useState("Field Operator - Site Bay 1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const selectedBundle = bundles.find(b => b.tag_id === selectedTag || b.bundle_id === selectedTag);
  const currentQty = selectedBundle ? selectedBundle.current_quantity : 0;
  const startingQty = selectedBundle ? selectedBundle.starting_quantity : 0;
  const minQty = selectedBundle ? selectedBundle.minimum_quantity : 3;
  const calculatedRemaining = Math.max(0, currentQty - (parseInt(qtyRemoved) || 0));

  const willBeLowStock = calculatedRemaining > 0 && calculatedRemaining <= minQty;
  const willBeOutOfStock = calculatedRemaining === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBundle) return;
    const qty = parseInt(qtyRemoved);
    if (!qty || qty <= 0) return;
    if (qty > currentQty) {
      alert(`Cannot remove ${qty} units. Only ${currentQty} units available in bundle!`);
      return;
    }

    setIsSubmitting(true);
    const result = await onRecordRemoval({
      tag_id: selectedBundle.tag_id,
      bundle_id: selectedBundle.bundle_id,
      qty_removed: qty,
      performed_by: performer || "RFID Scanner Simulator",
      notes: notes || "Simulated bundle scan & removal",
    });

    setLastResult(result);
    setIsSubmitting(false);
  };

  return (
    <div className="rfid-simulator-card">
      <div className="simulator-header">
        <div className="sim-title-group">
          <div className="sim-radar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
              <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 14v7" />
            </svg>
          </div>
          <div>
            <h3 className="sim-title">Live RFID Reader & Removal Scanner</h3>
            <p className="sim-desc">
              Simulates physical bundle tap (RC522 reader) + removal quantity logging
            </p>
          </div>
        </div>
        <span className="live-sim-badge font-mono">Hardware Terminal</span>
      </div>

      <form onSubmit={handleSubmit} className="simulator-form">
        <div className="sim-form-grid">
          {/* 1. Scanned RFID Tag */}
          <div className="form-group">
            <label className="form-label">
              <span className="step-num">1</span> Scanned Bundle RFID Tag
            </label>
            <div className="tag-select-wrapper">
              <select 
                className="sim-select font-mono"
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setLastResult(null);
                }}
              >
                {bundles.map(b => (
                  <option key={b.bundle_id} value={b.tag_id}>
                    {b.tag_id} ({b.bundle_id} - {b.material_type || b.pipe_type} | Avail: {b.current_quantity})
                  </option>
                ))}
              </select>
            </div>
            {selectedBundle && (
              <div className="bundle-tag-preview">
                <span className="preview-item"><strong>Location:</strong> {selectedBundle.location}</span>
                <span className="preview-item"><strong>Current Stock:</strong> <span className="font-mono text-cyan">{selectedBundle.current_quantity}</span> / {selectedBundle.starting_quantity} units</span>
                <span className="preview-item"><strong>Min Alert:</strong> <span className="font-mono text-amber">{selectedBundle.minimum_quantity}</span> units</span>
              </div>
            )}
          </div>

          {/* 2. Units Removed */}
          <div className="form-group">
            <label className="form-label">
              <span className="step-num">2</span> Units Removed from Bundle
            </label>
            <div className="qty-quick-buttons">
              {[1, 2, 3, 5].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`btn-qty-preset ${parseInt(qtyRemoved) === preset ? "active" : ""}`}
                  onClick={() => setQtyRemoved(preset)}
                >
                  -{preset}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max={currentQty || 1}
                className="qty-custom-input font-mono"
                value={qtyRemoved}
                onChange={(e) => setQtyRemoved(e.target.value)}
                placeholder="Qty"
                required
              />
            </div>

            {/* Formula Preview from User Spec */}
            <div className="formula-live-box">
              <span className="formula-label">Realtime Calculation:</span>
              <div className="formula-calc font-mono">
                <span className="calc-curr">{currentQty}</span> (Prev)
                <span className="calc-op"> − </span>
                <span className="calc-rem">{qtyRemoved || 0}</span> (Removed)
                <span className="calc-op"> = </span>
                <span className={`calc-res ${willBeOutOfStock ? "out" : willBeLowStock ? "low" : "normal"}`}>
                  {calculatedRemaining} units remaining
                </span>
              </div>
              {willBeOutOfStock ? (
                <span className="calc-alert-hint out">🚨 Warning: Will result in OUT OF STOCK</span>
              ) : willBeLowStock ? (
                <span className="calc-alert-hint low">⚠️ Alert: Will trigger LOW STOCK NOTIFICATION (≤ {minQty})</span>
              ) : (
                <span className="calc-alert-hint normal">✔️ Normal safe stock level</span>
              )}
            </div>
          </div>

          {/* 3. Operator & Notes */}
          <div className="form-group">
            <label className="form-label">
              <span className="step-num">3</span> Authorization / Operator
            </label>
            <input 
              type="text"
              className="sim-input"
              value={performer}
              onChange={(e) => setPerformer(e.target.value)}
              placeholder="e.g. Foreman Mike, Crew Alpha"
              required
            />
            <input 
              type="text"
              className="sim-input mt-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Job notes (e.g. Sector 3 HVAC riser installation)"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="sim-footer">
          <div className="sim-footer-left">
            {lastResult && (
              <div className={`scan-feedback-badge ${lastResult.is_low_stock ? "low" : "success"}`}>
                <span className="feedback-dot" />
                <span>
                  Transmitted! {lastResult.bundle_id}: {lastResult.previous_quantity} - {lastResult.qty_removed} = {lastResult.remaining_quantity} remaining ({lastResult.status})
                </span>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="btn-submit-scan"
            disabled={isSubmitting || currentQty === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span>{isSubmitting ? "Updating Supabase..." : "Record Material Removal"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
