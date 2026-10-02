import React, { useState } from "react";
import "./PipeBundleTable.css";

export default function PipeBundleTable({ 
  bundles, 
  onOpenRemovalModal, 
  onOpenRestockModal,
  onDeleteBundle 
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredBundles = bundles.filter((bundle) => {
    // Filter by tab
    if (filter === "normal" && (bundle.current_quantity <= bundle.minimum_quantity)) return false;
    if (filter === "low" && (bundle.current_quantity === 0 || bundle.current_quantity > bundle.minimum_quantity)) return false;
    if (filter === "out" && bundle.current_quantity > 0) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchBundle = bundle.bundle_id.toLowerCase().includes(q);
      const matchTag = bundle.tag_id.toLowerCase().includes(q);
      const matchType = (bundle.material_type || bundle.pipe_type || "").toLowerCase().includes(q);
      const matchLoc = (bundle.location || "").toLowerCase().includes(q);
      return matchBundle || matchTag || matchType || matchLoc;
    }

    return true;
  });

  return (
    <div className="bundle-table-card">
      <div className="table-toolbar">
        <div className="toolbar-left">
          <h3 className="section-title">Material & Bundle Inventory</h3>
          <span className="count-pill font-mono">{filteredBundles.length} Bundles</span>
        </div>

        <div className="toolbar-right">
          {/* Status Tabs */}
          <div className="status-tabs">
            <button 
              className={`tab-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button 
              className={`tab-btn normal ${filter === "normal" ? "active" : ""}`}
              onClick={() => setFilter("normal")}
            >
              Normal
            </button>
            <button 
              className={`tab-btn low ${filter === "low" ? "active" : ""}`}
              onClick={() => setFilter("low")}
            >
              Low Stock
            </button>
            <button 
              className={`tab-btn out ${filter === "out" ? "active" : ""}`}
              onClick={() => setFilter("out")}
            >
              Out of Stock
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search bundle, RFID tag, material, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="btn-clear-search" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Stacked Cards Layout (< 640px) */}
      <div className="mobile-cards-wrapper">
        {filteredBundles.length === 0 ? (
          <div className="empty-state">
            No material bundles match the selected criteria.
          </div>
        ) : (
          filteredBundles.map((bundle) => {
            const isZero = bundle.current_quantity === 0;
            const isLow = !isZero && bundle.current_quantity <= bundle.minimum_quantity;
            const percent = Math.min(100, Math.round((bundle.current_quantity / (bundle.starting_quantity || 1)) * 100));

            let statusBadge = "normal";
            let statusText = "Normal Stock";
            if (isZero) {
              statusBadge = "out";
              statusText = "Out of Stock";
            } else if (isLow) {
              statusBadge = "low";
              statusText = "Low Stock";
            }

            return (
              <div key={`mob-${bundle.bundle_id}`} className={`mobile-record-card ${statusBadge}`}>
                <div className="mobile-card-top">
                  <div className="mobile-id-group">
                    <span className="bundle-code font-mono">{bundle.bundle_id}</span>
                    <span className="tag-code font-mono">{bundle.tag_id}</span>
                  </div>
                  <span className={`status-pill ${statusBadge}`}>
                    <span className="status-dot" />
                    <span>{statusText}</span>
                  </span>
                </div>

                <div className="mobile-card-title">
                  {bundle.material_type || bundle.pipe_type}
                </div>

                <div className="mobile-gauge-row">
                  <div className="gauge-bar-bg">
                    <div 
                      className={`gauge-fill ${statusBadge}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="gauge-label font-mono">{percent}%</span>
                </div>

                <div className="mobile-card-details">
                  <div className="mobile-detail-item">
                    <span className="detail-label">Current Qty</span>
                    <span className={`current-qty-badge font-mono ${statusBadge}`}>
                      {bundle.current_quantity} pcs
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Starting</span>
                    <span className="detail-value font-mono">
                      {bundle.starting_quantity} pcs
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Min Limit</span>
                    <span className="detail-value font-mono">
                      {bundle.minimum_quantity} pcs
                    </span>
                  </div>
                </div>

                <div className="mobile-location-row">
                  <div className="location-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{bundle.location || "Store Room A"}</span>
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button 
                    className="btn-action remove" 
                    onClick={() => onOpenRemovalModal(bundle)}
                    disabled={bundle.current_quantity === 0}
                    title="Record units removed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Remove</span>
                  </button>
                  <button 
                    className="btn-action restock" 
                    onClick={() => onOpenRestockModal(bundle)}
                    title="Restock units into bundle"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="table-responsive desktop-table-only">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Bundle ID</th>
              <th>RFID Tag ID</th>
              <th>Material / Specification</th>
              <th>Stock Level (Gauge)</th>
              <th>Starting Qty</th>
              <th>Current Qty</th>
              <th>Min Limit</th>
              <th>Location</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBundles.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  No material bundles match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredBundles.map((bundle) => {
                const isZero = bundle.current_quantity === 0;
                const isLow = !isZero && bundle.current_quantity <= bundle.minimum_quantity;
                const percent = Math.min(100, Math.round((bundle.current_quantity / (bundle.starting_quantity || 1)) * 100));

                let statusBadge = "normal";
                let statusText = "Normal Stock";
                if (isZero) {
                  statusBadge = "out";
                  statusText = "Out of Stock";
                } else if (isLow) {
                  statusBadge = "low";
                  statusText = "Low Stock";
                }

                return (
                  <tr key={bundle.bundle_id} className={`table-row ${statusBadge}`}>
                    <td>
                      <span className="bundle-code font-mono">{bundle.bundle_id}</span>
                    </td>
                    <td>
                      <span className="tag-code font-mono">{bundle.tag_id}</span>
                    </td>
                    <td>
                      <div className="pipe-spec-name">{bundle.material_type || bundle.pipe_type}</div>
                    </td>
                    <td className="gauge-cell">
                      <div className="gauge-wrapper">
                        <div className="gauge-bar-bg">
                          <div 
                            className={`gauge-fill ${statusBadge}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="gauge-label font-mono">{percent}%</span>
                      </div>
                    </td>
                    <td className="font-mono text-muted">
                      {bundle.starting_quantity}
                    </td>
                    <td>
                      <span className={`current-qty-badge font-mono ${statusBadge}`}>
                        {bundle.current_quantity} pcs
                      </span>
                    </td>
                    <td className="font-mono text-muted">
                      {bundle.minimum_quantity}
                    </td>
                    <td>
                      <div className="location-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{bundle.location || "Store Room A"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${statusBadge}`}>
                        <span className="status-dot" />
                        <span>{statusText}</span>
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button 
                          className="btn-action remove" 
                          onClick={() => onOpenRemovalModal(bundle)}
                          disabled={bundle.current_quantity === 0}
                          title="Record units removed"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>Remove</span>
                        </button>
                        <button 
                          className="btn-action restock" 
                          onClick={() => onOpenRestockModal(bundle)}
                          title="Restock units into bundle"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>Restock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
