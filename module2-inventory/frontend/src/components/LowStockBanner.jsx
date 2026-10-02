import React, { useState } from "react";
import "./LowStockBanner.css";

export default function LowStockBanner({ lowStockBundles, onRestockClick }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!lowStockBundles || lowStockBundles.length === 0 || isDismissed) {
    return null;
  }

  return (
    <div className="low-stock-alert-container">
      <div className="alert-header">
        <div className="alert-title-row">
          <div className="alert-pulsing-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h4 className="alert-heading">LOW STOCK ALERT ({lowStockBundles.length} Bundles At/Below Safety Limit)</h4>
            <p className="alert-subheading">
              Automatic threshold notification triggered. Replenish immediately to avoid site work stoppages.
            </p>
          </div>
        </div>
        <button 
          className="btn-dismiss-alert" 
          onClick={() => setIsDismissed(true)} 
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>

      <div className="alert-bundle-cards">
        {lowStockBundles.map((bundle) => {
          const isZero = bundle.current_quantity === 0;
          return (
            <div key={bundle.bundle_id} className={`alert-card ${isZero ? "critical" : "warning"}`}>
              <div className="alert-card-left">
                <div className="bundle-meta">
                  <span className="alert-badge font-mono">{bundle.bundle_id}</span>
                  <span className="alert-pipe-type">{bundle.material_type || bundle.pipe_type}</span>
                  <span className="alert-tag font-mono">{bundle.tag_id}</span>
                </div>
                <div className="alert-quantities">
                  <div className="qty-metric">
                    <span className="metric-label">Remaining:</span>
                    <span className={`metric-val font-mono ${isZero ? "out" : "low"}`}>
                      {bundle.current_quantity} units
                    </span>
                  </div>
                  <div className="qty-divider">/</div>
                  <div className="qty-metric">
                    <span className="metric-label">Minimum Required:</span>
                    <span className="metric-val font-mono">{bundle.minimum_quantity} units</span>
                  </div>
                  <div className="qty-divider">|</div>
                  <div className="qty-metric">
                    <span className="metric-label">Location:</span>
                    <span className="metric-val">{bundle.location}</span>
                  </div>
                </div>
              </div>
              <div className="alert-card-right">
                <button 
                  className="btn-alert-restock"
                  onClick={() => onRestockClick(bundle)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>Restock</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
