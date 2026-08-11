import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import StatsBar from "../components/StatsBar";
import AttendanceTable from "../components/AttendanceTable";
import WeeklyTrendChart from "../components/WeeklyTrendChart";
import PayrollReport from "../components/PayrollReport";
import AddWorkerModal from "../components/AddWorkerModal";
import EditAttendanceModal from "../components/EditAttendanceModal";
import AuditLogView from "../components/AuditLogView";
import "./Dashboard.css";

export default function ContractorDash({ userProfile }) {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'audit'

  const activeContractorId = userProfile?.id;

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("attendance-realtime")
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

  const handleRecordUpdated = (updatedRecord) => {
    setAttendance((prev) =>
      prev.map((a) => (a.id === updatedRecord.id ? { ...a, ...updatedRecord } : a))
    );
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this attendance record for ${getUserName(record.user_id)}?`)) {
      return;
    }

    const { error } = await supabase.rpc("delete_attendance_record", {
      p_attendance_id: record.id,
    });

    if (error) {
      alert(`Failed to delete record: ${error.message}`);
    } else {
      setAttendance((prev) => prev.filter((a) => a.id !== record.id));
    }
  };

  const getUserName = (userId) => {
    const u = users.find((usr) => usr.id === userId);
    return u?.full_name || "Worker";
  };

  const workerList = users.filter((u) => u.role === "worker");

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

        <button className="add-worker-btn" onClick={() => setIsAddModalOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Member
        </button>
      </div>

      <StatsBar attendance={attendance} totalWorkers={workerList.length} />

      <WeeklyTrendChart attendance={attendance} totalWorkers={workerList.length} />

      {/* Main Tab Toggle */}
      <div className="dash-section">
        <div className="section-header-tabs">
          <div className="tab-buttons">
            <button
              className={`section-tab-btn ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              📋 Recent Attendance Activity
            </button>
            <button
              className={`section-tab-btn ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              📜 Edit History & Audit Trail
            </button>
          </div>
        </div>

        {activeTab === "activity" ? (
          <AttendanceTable
            attendance={attendance}
            users={users}
            showWorkerName={true}
            userRole="contractor"
            onEditRecord={(rec) => setEditingRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
          />
        ) : (
          <AuditLogView userProfile={userProfile} />
        )}
      </div>

      <PayrollReport
        attendance={attendance}
        users={users}
        contractorId={activeContractorId}
      />

      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWorkerAdded={handleWorkerAdded}
        existingUsers={users}
        currentUserRole="contractor"
        currentUserId={userProfile?.id}
        contractorId={activeContractorId}
      />

      <EditAttendanceModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        users={users}
        onRecordUpdated={handleRecordUpdated}
      />
    </div>
  );
}
