import React, { useState } from "react";
import "./InventoryHistoryTable.css";

export default function InventoryHistoryTable({ history }) {
  const [filterBundle, setFilterBundle] = useState("all");

  const bundlesInHistory = Array.from(new Set(history.map(h => h.bundle_id)));

  const filteredHistory = history.filter(item => {
    if (filterBundle !== "all" && item.bundle_id !== filterBundle) return false;
    return true;
  });

  const exportCsv = () => {
    const headers = ["Time", "Bundle ID", "Tag ID", "Action", "Qty Removed", "Remaining Qty", "Operator", "Notes"];
    const rows = filteredHistory.map(h => [
      h.created_at,
      h.bundle_id,
      h.tag_id || "",
      h.action,
      h.qty_removed || 0,
      h.remaining_quantity,
      `"${h.performed_by || ""}"`,
      `"${h.notes || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material_inventory_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="history-table-card">
      <div className="history-toolbar">
        <div className="toolbar-left">
          <div className="history-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 className="section-title">Inventory History Audit Log</h3>
            <span className="history-subtitle">Immutable log of all physical scans, removals, and restocks</span>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Bundle Filter */}
          <select 
            className="bundle-filter-select font-mono"
            value={filterBundle}
            onChange={(e) => setFilterBundle(e.target.value)}
          >
            <option value="all">All Bundles</option>
            {bundlesInHistory.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <button className="btn-export-csv" onClick={exportCsv} title="Download CSV Log">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile Stacked History Cards (< 640px) */}
      <div className="mobile-history-wrapper">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            No inventory transactions recorded yet.
          </div>
        ) : (
          filteredHistory.map((item, index) => {
            const isRemoval = item.action === "Removed";
            const isRestock = item.action === "Restocked";

            return (
              <div key={`mob-hist-${item.id || index}`} className="mobile-history-card">
                <div className="mobile-card-top">
                  <div className="mobile-id-group">
                    <span className="bundle-code font-mono">{item.bundle_id}</span>
                    <span className={`action-badge ${item.action.toLowerCase()}`}>
                      {item.action}
                    </span>
                  </div>
                  <span className="time-badge font-mono">
                    {typeof item.created_at === "string" && item.created_at.length > 8 
                      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : item.created_at || "—"}
                  </span>
                </div>

                <div className="mobile-card-details">
                  <div className="mobile-detail-item">
                    <span className="detail-label">Quantity</span>
                    <span className="detail-value font-mono">
                      {isRemoval ? (
                        <span className="qty-removed-tag">−{item.qty_removed} pcs</span>
                      ) : isRestock ? (
                        <span className="qty-restock-tag">+{item.qty_removed || item.qty_added} pcs</span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Remaining</span>
                    <span className="detail-value font-mono remaining-badge">
                      {item.remaining_quantity} pcs
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Operator</span>
                    <span className="detail-value operator-name">
                      {item.performed_by || "System"}
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <div className="mobile-history-notes">
                    <span className="detail-label">Notes: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="table-responsive desktop-table-only">
        <table className="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Bundle ID</th>
              <th>Action</th>
              <th>Qty. Removed</th>
              <th>Remaining Balance</th>
              <th>Operator / Reader</th>
              <th>Notes / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No inventory transactions recorded yet.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, index) => {
                const isRemoval = item.action === "Removed";
                const isRestock = item.action === "Restocked";
                const isInitial = item.action === "Initial";

                return (
                  <tr key={item.id || index} className="history-row">
                    <td>
                      <span className="time-badge font-mono">
                        {typeof item.created_at === "string" && item.created_at.length > 8 
                          ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : item.created_at || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="bundle-code font-mono">{item.bundle_id}</span>
                    </td>
                    <td>
                      <span className={`action-badge ${item.action.toLowerCase()}`}>
                        {item.action}
                      </span>
                    </td>
                    <td>
                      {isRemoval ? (
                        <span className="qty-removed-tag font-mono">
                          −{item.qty_removed} pcs
                        </span>
                      ) : isRestock ? (
                        <span className="qty-restock-tag font-mono">
                          +{item.qty_removed || item.qty_added} pcs
                        </span>
                      ) : (
                        <span className="text-dim font-mono">—</span>
                      )}
                    </td>
                    <td>
                      <span className="remaining-badge font-mono">
                        {item.remaining_quantity} pcs
                      </span>
                    </td>
                    <td>
                      <span className="operator-name">{item.performed_by || "System"}</span>
                    </td>
                    <td>
                      <span className="history-notes">{item.notes || "—"}</span>
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
