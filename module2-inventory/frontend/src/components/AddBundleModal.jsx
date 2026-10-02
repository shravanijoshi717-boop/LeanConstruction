import React, { useState } from "react";
import "./Modals.css";

export default function AddBundleModal({ isOpen, onClose, onAddBundle }) {
  const [bundleId, setBundleId] = useState("");
  const [tagId, setTagId] = useState("");
  const [pipeType, setPipeType] = useState("PVC Pipe 4\"");
  const [startingQty, setStartingQty] = useState(10);
  const [minQty, setMinQty] = useState(3);
  const [location, setLocation] = useState("Store Room A");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bundleId.trim() || !tagId.trim()) {
      alert("Please enter Bundle ID and RFID Tag ID");
      return;
    }

    setIsSubmitting(true);
    await onAddBundle({
      bundle_id: bundleId.trim().toUpperCase(),
      tag_id: tagId.trim().toUpperCase(),
      material_type: pipeType,
      pipe_type: pipeType,
      starting_quantity: parseInt(startingQty) || 10,
      current_quantity: parseInt(startingQty) || 10,
      minimum_quantity: parseInt(minQty) || 3,
      location: location.trim() || "Store Room A",
      status: "Available"
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="modal-title">Register Tagged Material Bundle</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-form-grid">
              <div className="modal-field">
                <label className="field-label">Bundle ID *</label>
                <input 
                  type="text"
                  className="field-input font-mono"
                  placeholder="e.g. BNDL-005 / REBAR-B01"
                  value={bundleId}
                  onChange={(e) => setBundleId(e.target.value)}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="field-label">RFID Tag UID / EPC *</label>
                <input 
                  type="text"
                  className="field-input font-mono"
                  placeholder="e.g. EPC-MAT-005"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-field">
              <label className="field-label">Material Category & Specification *</label>
              <select 
                className="field-select"
                value={pipeType}
                onChange={(e) => setPipeType(e.target.value)}
              >
                <optgroup label="Pipes & Plumbing">
                  <option value="PVC Pipe 4&quot;">4&quot; PVC Pipe Schedule 40</option>
                  <option value="PVC Pipe 2&quot;">2&quot; PVC Pipe Schedule 40</option>
                  <option value="GI Pipe 2&quot;">2&quot; Galvanized Iron (GI) Pipe</option>
                  <option value="Copper Pipe 1/2&quot;">1/2&quot; Copper Plumbing Pipe</option>
                  <option value="CPVC Pipe 1&quot;">1&quot; CPVC Hot/Cold Pipe</option>
                </optgroup>
                <optgroup label="Structural Steel & Rebar">
                  <option value="TMT Rebar 12mm (Bundle of 10)">TMT Steel Rebar 12mm (Bundle of 10)</option>
                  <option value="TMT Rebar 16mm (Bundle of 8)">TMT Steel Rebar 16mm (Bundle of 8)</option>
                  <option value="TMT Rebar 20mm (Bundle of 5)">TMT Steel Rebar 20mm (Bundle of 5)</option>
                  <option value="Scaffolding Steel Pipes (6m Pack)">Scaffolding Steel Pipes (6m Pack of 6)</option>
                </optgroup>
                <optgroup label="Electrical & Conduits">
                  <option value="HDPE Conduit 1&quot;">1&quot; HDPE Electrical Conduit (100m Roll)</option>
                  <option value="PVC Conduit 25mm">25mm Rigid PVC Electrical Conduit</option>
                  <option value="Cable Spool 2.5mm² (100m)">Copper Cable Spool 2.5mm² (100m)</option>
                  <option value="Armored Cable 4-Core (50m)">Armored Power Cable 4-Core (50m)</option>
                </optgroup>
                <optgroup label="Timber & Framing">
                  <option value="Timber 2x4 Lumber (10ft Pack)">Timber 2x4 Lumber (10ft Pack of 10)</option>
                  <option value="Plywood Sheets 18mm (Pack)">18mm Shuttering Plywood (Pack of 5)</option>
                </optgroup>
              </select>
            </div>

            <div className="modal-form-grid">
              <div className="modal-field">
                <label className="field-label">Starting Bundle Units *</label>
                <input 
                  type="number"
                  min="1"
                  className="field-input font-mono"
                  value={startingQty}
                  onChange={(e) => setStartingQty(e.target.value)}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="field-label">Minimum Safety Limit *</label>
                <input 
                  type="number"
                  min="1"
                  className="field-input font-mono"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-field">
              <label className="field-label">Site Storage Location</label>
              <input 
                type="text"
                className="field-input"
                placeholder="e.g. Store Room A, Yard Bay 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Save Bundle to Database"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
