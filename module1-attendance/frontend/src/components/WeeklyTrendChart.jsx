import { useState } from "react";
import "./WeeklyTrendChart.css";

export default function WeeklyTrendChart({ attendance = [], totalWorkers = 0 }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Generate array for the last 7 days (ending Today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const trendData = last7Days.map((dateObj, index) => {
    const isToday = index === 6;
    const dateStr = dateObj.toISOString().split("T")[0];
    const dayLabel = isToday ? "Today" : dayNames[dateObj.getDay()];
    const dateLabel = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    // Filter attendance records for this specific date
    const dayRecords = attendance.filter((a) => {
      if (!a.check_in) return false;
      const checkInDate = new Date(a.check_in).toISOString().split("T")[0];
      return checkInDate === dateStr;
    });

    // Normalize status for case-insensitive comparison
    const getStatus = (a) => (a.status || "").toLowerCase();

    const onTimeCount = dayRecords.filter((a) => getStatus(a) === "present").length;
    const lateCount = dayRecords.filter((a) => getStatus(a) === "late").length;
    const totalCheckedIn = dayRecords.filter(
      (a) => getStatus(a) === "present" || getStatus(a) === "late"
    ).length;

    // Absent workers for that day
    const absentCount = Math.max(0, totalWorkers - totalCheckedIn);

    // Percentages for stacked bar segments (relative to totalWorkers or min 1)
    const baseTotal = totalWorkers > 0 ? totalWorkers : 1;
    const onTimePct = (onTimeCount / baseTotal) * 100;
    const latePct = (lateCount / baseTotal) * 100;
    const absentPct = (absentCount / baseTotal) * 100;
    const attendancePct = Math.round((totalCheckedIn / baseTotal) * 100);

    return {
      dateStr,
      dayLabel,
      dateLabel,
      isToday,
      onTimeCount,
      lateCount,
      absentCount,
      totalCheckedIn,
      onTimePct,
      latePct,
      absentPct,
      attendancePct,
    };
  });

  // Find max attendance percentage for relative scaling
  const maxPct = Math.max(...trendData.map((d) => d.onTimePct + d.latePct + d.absentPct), 1);

  return (
    <div className="trend-card">
      <div className="trend-header">
        <div>
          <h4>7-Day Workforce Trend</h4>
          <p>Daily attendance breakdown across site operations</p>
        </div>
        <div className="trend-legend">
          <div className="legend-item">
            <span className="legend-dot dot-present" /> On Time
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-late" /> Late
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-absent" /> Absent
          </div>
        </div>
      </div>

      <div className="trend-chart-area">
        {/* Y-axis labels */}
        <div className="y-axis">
          <span className="y-label">{totalWorkers}</span>
          <span className="y-label">{Math.round(totalWorkers * 0.5)}</span>
          <span className="y-label">0</span>
        </div>

        {/* Grid + bars */}
        <div className="chart-body">
          {/* Horizontal grid lines */}
          <div className="grid-lines">
            <div className="grid-line" />
            <div className="grid-line" />
            <div className="grid-line" />
          </div>

          <div className="trend-bars">
            {trendData.map((item, idx) => (
              <div
                key={item.dateStr}
                className={`bar-column ${item.isToday ? "is-today" : ""}`}
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div className="bar-track">
                  {/* Stacked bar segments: Absent (top), Late (middle), On Time (bottom) */}
                  {item.absentCount > 0 && (
                    <div
                      className="bar-segment seg-absent"
                      style={{
                        height: `${item.absentPct}%`,
                        animationDelay: `${idx * 60 + 120}ms`,
                      }}
                    />
                  )}
                  {item.lateCount > 0 && (
                    <div
                      className="bar-segment seg-late"
                      style={{
                        height: `${item.latePct}%`,
                        animationDelay: `${idx * 60 + 60}ms`,
                      }}
                    />
                  )}
                  {item.onTimeCount > 0 && (
                    <div
                      className="bar-segment seg-present"
                      style={{
                        height: `${item.onTimePct}%`,
                        animationDelay: `${idx * 60}ms`,
                      }}
                    />
                  )}
                </div>

                {/* Tooltip on hover */}
                {hoveredBar === idx && (
                  <div className="bar-tooltip">
                    <div className="tooltip-title">{item.dayLabel} — {item.dateLabel}</div>
                    <div className="tooltip-rows">
                      <div className="tooltip-row">
                        <span className="tooltip-dot dot-present" />
                        <span>On Time</span>
                        <span className="tooltip-val">{item.onTimeCount}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot dot-late" />
                        <span>Late</span>
                        <span className="tooltip-val">{item.lateCount}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot dot-absent" />
                        <span>Absent</span>
                        <span className="tooltip-val">{item.absentCount}</span>
                      </div>
                    </div>
                    <div className="tooltip-footer">
                      {item.attendancePct}% attendance
                    </div>
                  </div>
                )}

                <div className="bar-count-badge">
                  <span className="count-present">{item.totalCheckedIn}</span>
                  <span className="count-divider">/</span>
                  <span className="count-total">{totalWorkers}</span>
                </div>
                <span className="bar-label">{item.dayLabel}</span>
                {item.isToday ? null : (
                  <span className="bar-date-label">{item.dateLabel}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
