import "./StatsBar.css";

export default function StatsBar({ attendance, totalWorkers }) {
  const today = new Date().toISOString().split("T")[0];

  const todayRecords = attendance.filter((a) => {
    const checkInDate = new Date(a.check_in).toISOString().split("T")[0];
    return checkInDate === today;
  });

  // Normalize status to lowercase for case-insensitive comparison
  const getStatus = (a) => (a.status || "").toLowerCase();

  // Present Today = Anyone who checked in today with status "present" or "late"
  const presentOrLateRecords = todayRecords.filter(
    (a) => getStatus(a) === "present" || getStatus(a) === "late"
  );
  const totalPresentToday = presentOrLateRecords.length;
  const lateCount = todayRecords.filter((a) => getStatus(a) === "late").length;
  const onTimeCount = todayRecords.filter((a) => getStatus(a) === "present").length;
  const absentCount = Math.max(0, totalWorkers - totalPresentToday);

  const stats = [
    {
      label: "Present Today",
      value: totalPresentToday,
      subtext: `${onTimeCount} on time, ${lateCount} late`,
      variant: "success",
    },
    {
      label: "Late Arrivals",
      value: lateCount,
      subtext: lateCount > 0 ? "Requires supervisor review" : "All on time",
      variant: "warning",
    },
    {
      label: "Absent Workers",
      value: absentCount,
      subtext: "Not checked in today",
      variant: "danger",
    },
    {
      label: "Total Workers",
      value: totalWorkers,
      subtext: "Registered on site",
      variant: "neutral",
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card variant-${stat.variant}`}>
          <div className="stat-card-header">
            <span className="stat-dot" />
            <span className="stat-title">{stat.label}</span>
          </div>
          <div className="stat-card-body">
            <span className="stat-number">{stat.value}</span>
          </div>
          <div className="stat-subtext">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
