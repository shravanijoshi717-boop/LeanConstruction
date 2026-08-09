import "./WeeklyTrendChart.css";

export default function WeeklyTrendChart({ attendance = [], totalWorkers = 0 }) {
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

    // Filter attendance records for this specific date
    const dayRecords = attendance.filter((a) => {
      if (!a.check_in) return false;
      const checkInDate = new Date(a.check_in).toISOString().split("T")[0];
      return checkInDate === dateStr;
    });

    const onTimeCount = dayRecords.filter((a) => a.status === "present").length;
    const lateCount = dayRecords.filter((a) => a.status === "late").length;
    const totalCheckedIn = dayRecords.length;
    
    // Absent workers for that day
    const absentCount = Math.max(0, totalWorkers - totalCheckedIn);

    // Percentages for stacked bar segments (relative to totalWorkers or min 1)
    const baseTotal = totalWorkers > 0 ? totalWorkers : 1;
    const onTimePct = (onTimeCount / baseTotal) * 100;
    const latePct = (lateCount / baseTotal) * 100;
    const absentPct = (absentCount / baseTotal) * 100;

    return {
      dateStr,
      dayLabel,
      isToday,
      onTimeCount,
      lateCount,
      absentCount,
      totalCheckedIn,
      onTimePct,
      latePct,
      absentPct,
    };
  });

  return (
    <div className="trend-card">
      <div className="trend-header">
        <div>
          <h4>7-Day Workforce Efficiency Trend</h4>
          <p>Real-time turnout & punctuality breakdown across site operations</p>
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

      <div className="trend-bars">
        {trendData.map((item) => (
          <div key={item.dateStr} className={`bar-column ${item.isToday ? "is-today" : ""}`}>
            <div
              className="bar-track"
              title={`${item.dayLabel}: ${item.onTimeCount} On Time, ${item.lateCount} Late, ${item.absentCount} Absent out of ${totalWorkers} Total Workers`}
            >
              {/* Stacked bar segments: Absent (top), Late (middle), On Time (bottom) */}
              {item.absentCount > 0 && (
                <div
                  className="bar-segment seg-absent"
                  style={{ height: `${item.absentPct}%` }}
                />
              )}
              {item.lateCount > 0 && (
                <div
                  className="bar-segment seg-late"
                  style={{ height: `${item.latePct}%` }}
                />
              )}
              {item.onTimeCount > 0 && (
                <div
                  className="bar-segment seg-present"
                  style={{ height: `${item.onTimePct}%` }}
                />
              )}
            </div>
            
            <div className="bar-count-badge">
              <span className="count-present" title="On Time">{item.onTimeCount}</span>
              {item.lateCount > 0 && <span className="count-late" title="Late">+{item.lateCount}L</span>}
              {item.absentCount > 0 && <span className="count-absent" title="Absent">+{item.absentCount}A</span>}
            </div>
            <span className="bar-label">{item.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
