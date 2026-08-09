import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import StatsBar from "../components/StatsBar";
import AttendanceTable from "../components/AttendanceTable";
import AddWorkerModal from "../components/AddWorkerModal";
import "./Dashboard.css";

export default function SupervisorDash({ userProfile }) {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeContractorId = userProfile?.contractor_id || userProfile?.id;

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("attendance-realtime-supervisor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            if (!activeContractorId || payload.new.contractor_id === activeContractorId) {
              setAttendance((prev) => [payload.new, ...prev]);
            }
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
  }, [activeContractorId]);

  const fetchData = async () => {
    setLoading(true);
    let attendanceQuery = supabase.from("attendance").select("*").order("check_in", { ascending: false });
    let usersQuery = supabase.from("users").select("*");

    if (activeContractorId) {
      attendanceQuery = attendanceQuery.eq("contractor_id", activeContractorId);
      usersQuery = usersQuery.eq("contractor_id", activeContractorId);
    }

    const [attendanceRes, usersRes] = await Promise.all([
      attendanceQuery,
      usersQuery,
    ]);

    if (attendanceRes.data) setAttendance(attendanceRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    setLoading(false);
  };

  const handleWorkerAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const workerList = users.filter((u) => u.role === "worker");

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="app-loader" />
        <span>Loading workforce activity...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>Supervisor View — On-Site Operations</h2>
          <div className="dashboard-subtitle">
            <span>Daily Work Readiness & Shift Allocation</span>
            <span className="live-indicator">
              <span className="pulse-dot" /> Live Sync
            </span>
          </div>
        </div>

        <button className="add-worker-btn" onClick={() => setIsAddModalOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Worker
        </button>
      </div>

      <StatsBar attendance={attendance} totalWorkers={workerList.length} />

      <div className="supervisor-callout">
        <div className="callout-icon">📋</div>
        <div className="callout-content">
          <h4>Shift Supervisor Notice</h4>
          <p>
            Verify worker check-in times before assigning hazardous or high-elevation site tasks. 
            Late arrivals marked above require attendance validation before shift sign-off.
          </p>
        </div>
      </div>

      <div className="dash-section">
        <div className="section-header">
          <h3>Workforce On-Site Status</h3>
        </div>
        <AttendanceTable attendance={attendance} users={users} showWorkerName={true} />
      </div>

      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWorkerAdded={handleWorkerAdded}
        existingUsers={users}
        currentUserRole="supervisor"
        currentUserId={userProfile?.id}
        contractorId={activeContractorId}
      />
    </div>
  );
}
