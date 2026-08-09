import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AttendanceTable from "../components/AttendanceTable";
import "./Dashboard.css";

export default function WorkerDash({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("attendance-realtime-worker")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAttendance((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAttendance((prev) =>
              prev.map((a) => (a.id === payload.new.id ? payload.new : a))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .order("check_in", { ascending: false });

    if (data) setAttendance(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="app-loader" />
        <span>Loading personal attendance...</span>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => {
    return new Date(a.check_in).toISOString().split("T")[0] === today;
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>Worker Portal</h2>
          <div className="dashboard-subtitle">
            <span>Personal Attendance Log</span>
            <span className="live-indicator">
              <span className="pulse-dot" /> Live Sync
            </span>
          </div>
        </div>
      </div>

      <div className="worker-today-card">
        <div className="worker-today-title">Today's Summary</div>
        {todayRecord ? (
          <div className="worker-today-grid">
            <div>
              <div className="today-metric-label">Status</div>
              <span className={`status-pill status-${todayRecord.status}`}>
                {todayRecord.status}
              </span>
            </div>
            <div>
              <div className="today-metric-label">Check In</div>
              <div className="today-metric-value">
                {new Date(todayRecord.check_in).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
            <div>
              <div className="today-metric-label">Check Out</div>
              <div className="today-metric-value">
                {todayRecord.check_out
                  ? new Date(todayRecord.check_out).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "On Site"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: "#a1a1aa", fontSize: "0.875rem" }}>
            No check-in recorded for today yet.
          </div>
        )}
      </div>

      <div className="dash-section">
        <div className="section-header">
          <h3>Your Log History</h3>
        </div>
        <AttendanceTable attendance={attendance} users={[]} showWorkerName={false} />
      </div>
    </div>
  );
}
