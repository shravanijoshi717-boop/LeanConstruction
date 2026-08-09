import "./WeeklyTrendChart.css";

export default function WeeklyTrendChart({ attendance = [] }) {
  // Days of the week (last 7 days)
  const days = [
    { day: "Mon", present: 85, late: 10, absent: 5 },
    { day: "Tue", present: 90, late: 5, absent: 5 },
    { day: "Wed", present: 88, late: 8, absent: 4 },
    { day: "Thu", present: 92, late: 4, absent: 4 },
    { day: "Fri", present: 80, late: 12, absent: 8 },
    { day: "Sat", present: 75, late: 15, absent: 10 },
    { day: "Today", present: 100, late: 100, absent: 0, isCurrent: true },
  ];

  return (
    <div className="trend-card">
      <div className="trend-header">
        <div>
          <h4>7-Day Workforce Efficiency Trend</h4>
          <p>Daily attendance turnout rate across site operations</p>
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
        {days.map((item) => (
          <div key={item.day} className={`bar-column ${item.isCurrent ? "is-today" : ""}`}>
            <div className="bar-track">
              <div
                className="bar-segment seg-present"
                style={{ height: `${item.present}%` }}
                title={`On Time: ${item.present}%`}
              />
              <div
                className="bar-segment seg-late"
                style={{ height: `${item.late / 2}%` }}
                title={`Late: ${item.late}%`}
              />
            </div>
            <span className="bar-label">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
