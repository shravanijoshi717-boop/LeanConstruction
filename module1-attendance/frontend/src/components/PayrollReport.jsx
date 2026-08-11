import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import "./PayrollReport.css";

export default function PayrollReport({ attendance = [], users = [], contractorId }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [wageRates, setWageRates] = useState({ worker: 300, supervisor: 350 });
  const [editingWage, setEditingWage] = useState(null); // 'worker' | 'supervisor' | null
  const [tempWage, setTempWage] = useState("");
  const [savingWage, setSavingWage] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);

  // Fetch wage rates from DB
  useEffect(() => {
    if (!contractorId) return;
    const fetchRates = async () => {
      setLoadingRates(true);
      const { data } = await supabase
        .from("wage_rates")
        .select("role, daily_wage")
        .eq("contractor_id", contractorId);

      if (data) {
        const rates = { worker: 300, supervisor: 350 };
        data.forEach((r) => {
          rates[r.role] = Number(r.daily_wage);
        });
        setWageRates(rates);
      }
      setLoadingRates(false);
    };
    fetchRates();
  }, [contractorId]);

  // Save wage rate
  const handleSaveWage = async (role) => {
    const value = Number(tempWage);
    if (!value || value <= 0) return;

    setSavingWage(true);
    const { error } = await supabase
      .from("wage_rates")
      .upsert(
        {
          contractor_id: contractorId,
          role,
          daily_wage: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "contractor_id,role" }
      );

    if (!error) {
      setWageRates((prev) => ({ ...prev, [role]: value }));
      setEditingWage(null);
    }
    setSavingWage(false);
  };

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  // Calculate payroll data
  const payrollData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    // Total working days = days in month (or days until today for current month)
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = isCurrentMonth ? now.getDate() : daysInMonth;

    // Filter workers + supervisors under this contractor
    const payrollUsers = users.filter(
      (u) => u.role === "worker" || u.role === "supervisor"
    );

    const rows = payrollUsers.map((user) => {
      // Filter attendance for this user in selected month
      const userAttendance = attendance.filter((a) => {
        if (a.user_id !== user.id || !a.check_in) return false;
        const d = new Date(a.check_in);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      const getStatus = (a) => (a.status || "").toLowerCase();
      const presentDays = userAttendance.filter((a) => getStatus(a) === "present").length;
      const lateCount = userAttendance.filter((a) => getStatus(a) === "late").length;
      const totalCheckedIn = presentDays + lateCount;
      const absentDays = Math.max(0, workingDays - totalCheckedIn);

      // Deduction: absent days + (late_count / 3) proportional
      const lateDeductionDays = lateCount / 3;
      const totalDeductionDays = absentDays + lateDeductionDays;

      const dailyWage = wageRates[user.role] || 300;
      const grossPay = workingDays * dailyWage;
      const deductionAmount = totalDeductionDays * dailyWage;
      const finalPayment = Math.max(0, grossPay - deductionAmount);

      return {
        id: user.id,
        name: user.full_name,
        role: user.role,
        workingDays,
        presentDays,
        lateCount,
        absentDays,
        lateDeductionDays: Math.round(lateDeductionDays * 100) / 100,
        totalDeductionDays: Math.round(totalDeductionDays * 100) / 100,
        dailyWage,
        grossPay,
        deductionAmount: Math.round(deductionAmount),
        finalPayment: Math.round(finalPayment),
      };
    });

    // Sort: supervisors first, then workers, alphabetical within
    rows.sort((a, b) => {
      if (a.role !== b.role) return a.role === "supervisor" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const totalPayable = rows.reduce((sum, r) => sum + r.finalPayment, 0);
    const totalDeductions = rows.reduce((sum, r) => sum + r.deductionAmount, 0);

    return { rows, workingDays, totalPayable, totalDeductions };
  }, [attendance, users, selectedMonth, wageRates]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="payroll-section">
      <div className="payroll-header-row">
        <div className="payroll-title-group">
          <h3>Monthly Payroll Report</h3>
          <p>Automatic attendance-based salary calculation</p>
        </div>
        <div className="payroll-controls">
          <select
            className="month-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Wage Rate Cards */}
      <div className="wage-rates-row">
        {["worker", "supervisor"].map((role) => (
          <div key={role} className="wage-card">
            <div className="wage-card-header">
              <span className={`wage-role-badge role-${role}`}>
                {role === "worker" ? "👷" : "👔"} {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              {editingWage !== role && (
                <button
                  className="wage-edit-btn"
                  onClick={() => {
                    setEditingWage(role);
                    setTempWage(String(wageRates[role]));
                  }}
                  title="Edit wage rate"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="wage-card-body">
              {editingWage === role ? (
                <div className="wage-edit-form">
                  <div className="wage-input-group">
                    <span className="wage-currency">₹</span>
                    <input
                      type="number"
                      className="wage-input"
                      value={tempWage}
                      onChange={(e) => setTempWage(e.target.value)}
                      autoFocus
                      min="1"
                    />
                    <span className="wage-unit">/day</span>
                  </div>
                  <div className="wage-edit-actions">
                    <button
                      className="wage-save-btn"
                      onClick={() => handleSaveWage(role)}
                      disabled={savingWage}
                    >
                      {savingWage ? "..." : "Save"}
                    </button>
                    <button
                      className="wage-cancel-btn"
                      onClick={() => setEditingWage(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="wage-display">
                  <span className="wage-amount">{formatCurrency(wageRates[role])}</span>
                  <span className="wage-per-day">per day</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Deduction rules card */}
        <div className="wage-card deduction-rules-card">
          <div className="wage-card-header">
            <span className="wage-role-badge role-rules">📋 Deduction Rules</span>
          </div>
          <div className="wage-card-body">
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-trigger">1 day absent</span>
                <span className="rule-arrow">→</span>
                <span className="rule-result">1 day wage deducted</span>
              </div>
              <div className="rule-item">
                <span className="rule-trigger">3 late entries</span>
                <span className="rule-arrow">→</span>
                <span className="rule-result">1 day wage deducted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="payroll-table-card">
        {/* Desktop Table */}
        <div className="payroll-table-container desktop-payroll-only">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th className="col-num">Working Days</th>
                <th className="col-num">Present</th>
                <th className="col-num">Late</th>
                <th className="col-num">Absent</th>
                <th className="col-num">Late Deduction</th>
                <th className="col-num">Total Deduction</th>
                <th className="col-currency">Final Payment</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="payroll-empty">
                    No workers or supervisors found for this period.
                  </td>
                </tr>
              ) : (
                payrollData.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-employee">
                      <div className="employee-info">
                        <span className="employee-avatar">{row.name[0]}</span>
                        <span className="employee-name">{row.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill payroll-role-${row.role}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="col-num">{row.workingDays}</td>
                    <td className="col-num">
                      <span className="num-present">{row.presentDays}</span>
                    </td>
                    <td className="col-num">
                      <span className={`num-late ${row.lateCount > 0 ? "has-value" : ""}`}>
                        {row.lateCount}
                      </span>
                    </td>
                    <td className="col-num">
                      <span className={`num-absent ${row.absentDays > 0 ? "has-value" : ""}`}>
                        {row.absentDays}
                      </span>
                    </td>
                    <td className="col-num">
                      <span className={`num-deduction ${row.lateDeductionDays > 0 ? "has-value" : ""}`}>
                        {row.lateDeductionDays} day{row.lateDeductionDays !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="col-num">
                      <span className={`num-deduction ${row.totalDeductionDays > 0 ? "has-value" : ""}`}>
                        {row.totalDeductionDays} day{row.totalDeductionDays !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="col-currency">
                      <span className="payment-amount">{formatCurrency(row.finalPayment)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="mobile-payroll-cards">
          {payrollData.rows.map((row) => (
            <div key={`mob-${row.id}`} className="payroll-mobile-card">
              <div className="payroll-mob-header">
                <div className="employee-info">
                  <span className="employee-avatar">{row.name[0]}</span>
                  <div className="employee-meta">
                    <span className="employee-name">{row.name}</span>
                    <span className={`role-pill payroll-role-${row.role}`}>{row.role}</span>
                  </div>
                </div>
                <span className="payment-amount mob-payment">{formatCurrency(row.finalPayment)}</span>
              </div>
              <div className="payroll-mob-grid">
                <div className="mob-stat">
                  <span className="mob-stat-label">Working</span>
                  <span className="mob-stat-value">{row.workingDays}d</span>
                </div>
                <div className="mob-stat">
                  <span className="mob-stat-label">Present</span>
                  <span className="mob-stat-value num-present">{row.presentDays}</span>
                </div>
                <div className="mob-stat">
                  <span className="mob-stat-label">Late</span>
                  <span className={`mob-stat-value num-late ${row.lateCount > 0 ? "has-value" : ""}`}>{row.lateCount}</span>
                </div>
                <div className="mob-stat">
                  <span className="mob-stat-label">Absent</span>
                  <span className={`mob-stat-value num-absent ${row.absentDays > 0 ? "has-value" : ""}`}>{row.absentDays}</span>
                </div>
                <div className="mob-stat">
                  <span className="mob-stat-label">Deduction</span>
                  <span className={`mob-stat-value num-deduction ${row.totalDeductionDays > 0 ? "has-value" : ""}`}>{row.totalDeductionDays}d</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      {payrollData.rows.length > 0 && (
        <div className="payroll-summary">
          <div className="summary-item">
            <span className="summary-label">Total Employees</span>
            <span className="summary-value">{payrollData.rows.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Salary Deductions</span>
            <span className="summary-value summary-deduction">{formatCurrency(payrollData.totalDeductions)}</span>
          </div>
          <div className="summary-item summary-highlight">
            <span className="summary-label">Net Payable Disbursed</span>
            <span className="summary-value summary-total">{formatCurrency(payrollData.totalPayable)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
