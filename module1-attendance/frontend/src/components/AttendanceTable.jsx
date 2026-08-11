import { useState } from "react";
import "./AttendanceTable.css";

export default function AttendanceTable({
  attendance,
  users,
  showWorkerName = true,
  userRole = "worker",
  onEditRecord,
  onDeleteRecord,
}) {
  const [dateFilter, setDateFilter] = useState("today"); // 'today' | 'all' | 'YYYY-MM-DD'
  const [customDate, setCustomDate] = useState("");

  const formatTime = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getUserName = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user?.full_name || "Worker";
  };

  const getUserRole = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user?.role || "worker";
  };

  const isEditableByRole = (record) => {
    if (userRole === "contractor") return true;
    if (userRole === "supervisor") {
      const targetRole = getUserRole(record.user_id);
      return targetRole === "worker";
    }
    return false;
  };

  const canDelete = userRole === "contractor";

  // Date filtering logic
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredAttendance = attendance.filter((a) => {
    if (!a.check_in) return false;
    const recordDate = new Date(a.check_in).toISOString().split("T")[0];

    if (dateFilter === "today") {
      return recordDate === todayStr;
    } else if (dateFilter === "custom" && customDate) {
      return recordDate === customDate;
    }
    return true; // 'all'
  });

  const sorted = [...filteredAttendance].sort(
    (a, b) => new Date(b.check_in) - new Date(a.check_in)
  );

  const todayCount = attendance.filter(
    (a) => a.check_in && new Date(a.check_in).toISOString().split("T")[0] === todayStr
  ).length;

  return (
    <div className="attendance-view">
      {/* Table Date Filter Controls */}
      <div className="table-filter-bar">
        <div className="table-filter-tabs">
          <button
            className={`filter-tab-btn ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => {
              setDateFilter("today");
              setCustomDate("");
            }}
          >
            Today's Activity ({todayCount})
          </button>
          <button
            className={`filter-tab-btn ${dateFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setDateFilter("all");
              setCustomDate("");
            }}
          >
            All Historical Logs ({attendance.length})
          </button>
        </div>

        <div className="filter-date-picker">
          <span className="filter-picker-label">Filter Date:</span>
          <input
            type="date"
            className="date-picker-input"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter(e.target.value ? "custom" : "today");
            }}
          />
          {customDate && (
            <button
              className="btn-clear-date"
              onClick={() => {
                setCustomDate("");
                setDateFilter("today");
              }}
              title="Clear date filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h4>No Attendance Recorded {dateFilter === "today" ? "Today" : "for this filter"}</h4>
            <p>
              {dateFilter === "today"
                ? "Waiting for hardware ESP32 fingerprint scans or simulated entries..."
                : "Try selecting a different date or switch to 'All Historical Logs'."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 640px) */}
          <div className="mobile-cards-wrapper">
            {sorted.map((record) => (
              <div key={`mob-${record.id}`} className="mobile-record-card">
                <div className="mobile-card-top">
                  {showWorkerName ? (
                    <div className="worker-info">
                      <span className="worker-avatar">
                        {getUserName(record.user_id)[0]}
                      </span>
                      <div className="worker-meta">
                        <span className="worker-name-text">
                          {getUserName(record.user_id)}
                        </span>
                        <span className="col-date">{formatDate(record.check_in)}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="col-date">{formatDate(record.check_in)}</span>
                  )}

                  <div className="status-badge-group">
                    <span className={`status-pill status-${(record.status || '').toLowerCase()}`}>
                      {(record.status || '').charAt(0).toUpperCase() + (record.status || '').slice(1).toLowerCase()}
                    </span>
                    {record.is_manually_edited && (
                      <span className="edited-badge" title="Manually edited record">
                        ✏️ Edited
                      </span>
                    )}
                  </div>
                </div>

                <div className="mobile-card-details">
                  <div className="mobile-detail-item">
                    <span className="detail-label">Check In</span>
                    <span className="detail-value col-time">
                      {formatTime(record.check_in)}
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Check Out</span>
                    <span className="detail-value col-time">
                      {record.check_out ? (
                        formatTime(record.check_out)
                      ) : (
                        <span className="active-pill">
                          <span className="active-dot" /> On Site
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mobile-detail-item">
                    <span className="detail-label">Device</span>
                    <span className="detail-value col-device">
                      <code>{record.device_id || "esp32-default"}</code>
                    </span>
                  </div>
                </div>

                {isEditableByRole(record) && (
                  <div className="mobile-card-actions">
                    <button
                      className="btn-action-edit"
                      onClick={() => onEditRecord && onEditRecord(record)}
                    >
                      ✏️ Edit
                    </button>
                    {canDelete && (
                      <button
                        className="btn-action-delete"
                        onClick={() => onDeleteRecord && onDeleteRecord(record)}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="table-card desktop-table-only">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {showWorkerName && <th>Worker Name</th>}
                    <th>Date</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Status</th>
                    <th>Scanner Device</th>
                    {(userRole === "contractor" || userRole === "supervisor") && (
                      <th className="col-actions">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((record) => (
                    <tr key={`dt-${record.id}`}>
                      {showWorkerName && (
                        <td className="col-worker">
                          <div className="worker-info">
                            <span className="worker-avatar">
                              {getUserName(record.user_id)[0]}
                            </span>
                            <span className="worker-name-text">
                              {getUserName(record.user_id)}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="col-date">{formatDate(record.check_in)}</td>
                      <td className="col-time">{formatTime(record.check_in)}</td>
                      <td className="col-time">
                        {record.check_out ? (
                          formatTime(record.check_out)
                        ) : (
                          <span className="active-pill">
                            <span className="active-dot" /> On Site
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="status-badge-group">
                          <span className={`status-pill status-${(record.status || '').toLowerCase()}`}>
                            {(record.status || '').charAt(0).toUpperCase() + (record.status || '').slice(1).toLowerCase()}
                          </span>
                          {record.is_manually_edited && (
                            <span className="edited-badge" title="Manually edited record with audit log">
                              ✏️ Edited
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-device">
                        <code>{record.device_id || "esp32-default"}</code>
                      </td>

                      {(userRole === "contractor" || userRole === "supervisor") && (
                        <td className="col-actions">
                          {isEditableByRole(record) ? (
                            <div className="table-row-actions">
                              <button
                                className="btn-icon-edit"
                                onClick={() => onEditRecord && onEditRecord(record)}
                                title="Edit Attendance Record"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              {canDelete && (
                                <button
                                  className="btn-icon-delete"
                                  onClick={() => onDeleteRecord && onDeleteRecord(record)}
                                  title="Delete Attendance Record"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="no-access-text" title="Supervisors cannot edit other supervisors">
                              Read-only
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
