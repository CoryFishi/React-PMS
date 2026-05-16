// Shared helpers for dashboard time-series so charts always render a
// continuous axis even for months with no activity.

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// The last `count` months (inclusive of the current month), oldest first.
export function recentMonths(count, now = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: MONTH_NAMES[d.getMonth()],
    });
  }
  return out;
}

// Start-of-month Date `count` months back — use as the `$gte` match bound.
export function monthsAgo(count, now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() - (count - 1), 1);
}

// Project `$group` rows keyed by { _id: { year, month } } onto a zero-filled
// run of months. Returns [{ month: "Jan", value: <number> }, ...].
export function fillMonthly(rows, count, valueKey = "count", now = new Date()) {
  const map = new Map(
    rows.map((r) => [`${r._id.year}-${r._id.month}`, r[valueKey] ?? 0])
  );
  return recentMonths(count, now).map((m) => ({
    month: m.label,
    value: map.get(`${m.year}-${m.month}`) ?? 0,
  }));
}
