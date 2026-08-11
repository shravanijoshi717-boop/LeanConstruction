import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./AuditLogView.css";

export default function AuditLogView({ userProfile }) {
  const [logs, setLogs] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isContractor = userProfile?.role === "contractor";

  useEffect(() => {
    fetchAuditData();
  }, [userProfile]);

  const fetchAuditData = async () => {
    setLoading(true);

    const { data: usersData } = await supabase.from("users").select("id, full_name, role");
    const uMap = {};
    if (usersData) {
      usersData.forEach((u) => {
        uMap[u.id] = u;
      });
      setUsersMap(uMap);
    }

    let query = supabase
      .from("attendance_edit_log")
      .select("*, attendance:attendance_id(user_id, device_id)")
      .order("edited_at", { ascending: false });

    if (!isContractor) {
      query = query.eq("edited_by", userProfile?.id);
    }

    const { data: logData, error } = await query;

    if (logData) {
      setLogs(logData);
    }
    if (error) {
      console.error("Failed to fetch audit log:", error);
    }
    setLoading(false);
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredLogs = logs.filter((log) => {
    const targetUserId = log.attendance?.user_id;
    const targetName = usersMap[targetUserId]?.full_name || "Unknown Worker";
    const editorName = usersMap[log.edited_by]?.full_name || "Unknown User";
    const term = searchTerm.toLowerCase();

    return (
      targetName.toLowerCase().includes(term) ||
      editorName.toLowerCase().includes(term) ||
      (log.reason || "").toLowerCase().includes(term) ||
      (log.field_changed || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="audit-log-section">
      <div className="audit-log-header">
        <div>
          <h3>Attendance Audit Trail & Edit History</h3>
          <p>
            {isContractor
              ? "Permanent log of all manual attendance corrections across site operations"
              : "Log of manual attendance corrections made by you"}
          </p>
        </div>
        <div className="audit-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, reason, field..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="audit-table-card">
        {loading ? (
          <div className="dash-loading">
            <div className="app-loader" />
            <span>Loading audit log...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h4>No Edit Log Entries Found</h4>
            <p>Manual corrections made by authorized roles will appear here with justification.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (< 640px) */}
            <div className="mobile-audit-cards">
              {filteredLogs.map((log) => {
                const targetUser = usersMap[log.attendance?.user_id];
                const editorUser = usersMap[log.edited_by];

                return (
                  <div key={`mob-audit-${log.id}`} className="mobile-audit-card">
                    <div className="mobile-audit-top">
                      <div className="worker-info">
                        <span className="worker-avatar">
                          {(targetUser?.full_name || "W")[0]}
                        </span>
                        <div className="worker-meta">
                          <span className="worker-name-text">
                            {targetUser?.full_name || "Worker"}
                          </span>
                          <span className="col-date">{formatDate(log.edited_at)}</span>
                        </div>
                      </div>
                      <span className="field-badge">{log.field_changed}</span>
                    </div>

                    <div className="mobile-audit-diff">
                      <span className="audit-diff-label">Change:</span>
                      <div className="diff-view">
                        <span className="diff-old">{log.old_value || "None"}</span>
                        <span className="diff-arrow">→</span>
                        <span className="diff-new">{log.new_value || "None"}</span>
                      </div>
                    </div>

                    <div className="mobile-audit-reason">
                      <span className="audit-diff-label">Reason:</span>
                      <div className="reason-bubble">"{log.reason}"</div>
                    </div>

                    <div className="mobile-audit-footer">
                      <span>Edited by: <b>{editorUser?.full_name || "User"}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="table-container desktop-audit-only">
              <table className="data-table audit-table">
                <thead>
                  <tr>
                    <th>Target Employee</th>
                    <th>Field Changed</th>
                    <th>Original Value → New Value</th>
                    <th>Justification / Reason</th>
                    <th>Edited By</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const targetUser = usersMap[log.attendance?.user_id];
                    const editorUser = usersMap[log.edited_by];

                    return (
                      <tr key={log.id}>
                        <td className="col-worker">
                          <div className="worker-info">
                            <span className="worker-avatar">
                              {(targetUser?.full_name || "W")[0]}
                            </span>
                            <div className="worker-meta">
                              <span className="worker-name-text">
                                {targetUser?.full_name || "Worker"}
                              </span>
                              <span className="col-date">
                                Role: {targetUser?.role || "worker"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="field-badge">{log.field_changed}</span>
                        </td>
                        <td>
                          <div className="diff-view">
                            <span className="diff-old">{log.old_value || "None"}</span>
                            <span className="diff-arrow">→</span>
                            <span className="diff-new">{log.new_value || "None"}</span>
                          </div>
                        </td>
                        <td className="col-reason">
                          <div className="reason-bubble" title={log.reason}>
                            "{log.reason}"
                          </div>
                        </td>
                        <td>
                          <span className="editor-name">
                            {editorUser?.full_name || "User"}
                          </span>
                        </td>
                        <td className="col-time">{formatDate(log.edited_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
