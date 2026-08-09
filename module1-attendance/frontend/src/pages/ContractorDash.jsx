import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import StatsBar from "../components/StatsBar";
import AttendanceTable from "../components/AttendanceTable";
import WeeklyTrendChart from "../components/WeeklyTrendChart";
import "./Dashboard.css";

export default function ContractorDash() {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("attendance-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAttendance((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAttendance((prev) =>
              prev.map((a) => (a.id === payload.new.id ? payload.new : a))
            );
          } else if (payload.eventType === "DELETE") {
            setAttendance((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [attendanceRes, usersRes] = await Promise.all([
      supabase.from("attendance").select("*").order("check_in", { ascending: false }),
      supabase.from("users").select("*").eq("role", "worker"),
    ]);

    if (attendanceRes.data) setAttendance(attendanceRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="app-loader" />
        <span>Loading attendance records...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>Contractor Overview</h2>
          <div className="dashboard-subtitle">
            <span>Site Attendance & Workforce Monitoring</span>
            <span className="live-indicator">
              <span className="pulse-dot" /> Live Sync
            </span>
          </div>
        </div>
      </div>

      <StatsBar attendance={attendance} totalWorkers={users.length} />

      <div className="dash-section">
        <div className="section-header">
          <h3>Recent Attendance Activity</h3>
        </div>
        <AttendanceTable attendance={attendance} users={users} showWorkerName={true} />
      </div>

      <WeeklyTrendChart attendance={attendance} />
    </div>
  );
}
