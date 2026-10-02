import React from "react";
import "./KpiCards.css";

export default function KpiCards({ bundles, history }) {
  const totalBundles = bundles.length;
  const totalMaterialUnitsInStock = bundles.reduce((acc, b) => acc + (b.current_quantity || 0), 0);
  const lowStockCount = bundles.filter(b => b.current_quantity > 0 && b.current_quantity <= b.minimum_quantity).length;
  const outOfStockCount = bundles.filter(b => b.current_quantity === 0).length;
  const removalsLogged = history.filter(h => h.action === "Removed").length;

  return (
    <div className="kpi-grid">
      {/* 1. Total Bundles */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Tracked Bundles</span>
          <div className="kpi-icon indigo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono">{totalBundles}</div>
          <span className="kpi-caption">Active RFID tags tagged</span>
        </div>
      </div>

      {/* 2. Total Material Units in Stock */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Total Material Units</span>
          <div className="kpi-icon cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-cyan">{totalMaterialUnitsInStock} <span className="kpi-unit">units</span></div>
          <span className="kpi-caption">Aggregate site balance</span>
        </div>
      </div>

      {/* 3. Low Stock Bundles */}
      <div className={`kpi-card ${lowStockCount > 0 ? "warning-glow" : ""}`}>
        <div className="kpi-header">
          <span className="kpi-title">Low Stock Bundles</span>
          <div className="kpi-icon amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-amber">{lowStockCount}</div>
          <span className="kpi-caption">At or below minimum threshold</span>
        </div>
      </div>

      {/* 4. Out of Stock */}
      <div className={`kpi-card ${outOfStockCount > 0 ? "danger-glow" : ""}`}>
        <div className="kpi-header">
          <span className="kpi-title">Out of Stock</span>
          <div className="kpi-icon red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-red">{outOfStockCount}</div>
          <span className="kpi-caption">0 remaining in bundle</span>
        </div>
      </div>

      {/* 5. Removals Logged */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Removals Logged</span>
          <div className="kpi-icon emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="kpi-body">
          <div className="kpi-value font-mono text-emerald">{removalsLogged}</div>
          <span className="kpi-caption">Verified pull transactions</span>
        </div>
      </div>
    </div>
  );
}
