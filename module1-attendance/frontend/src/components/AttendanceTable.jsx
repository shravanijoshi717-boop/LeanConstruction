import "./AttendanceTable.css";

export default function AttendanceTable({ attendance, users, showWorkerName = true }) {
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

  const sorted = [...attendance].sort(
    (a, b) => new Date(b.check_in) - new Date(a.check_in)
  );

  if (sorted.length === 0) {
    return (
      <div className="table-card">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4>No Attendance Recorded Today</h4>
          <p>Waiting for hardware ESP32 fingerprint scans or simulated entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-view">
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
              <span className={`status-pill status-${record.status}`}>
                {record.status}
              </span>
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
                    <span className={`status-pill status-${record.status}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="col-device">
                    <code>{record.device_id || "esp32-default"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
