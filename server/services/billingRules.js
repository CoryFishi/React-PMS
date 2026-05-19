// server/services/billingRules.js

export function resolveGracePeriodDays(facility) {
  const v = facility?.settings?.billing?.gracePeriodDays;
  return Number.isFinite(v) && v >= 0 ? v : 7;
}

export function computeLateFee(lateFeeSettings, monthlyPrice) {
  const flat = Number(lateFeeSettings?.flatAmount) || 0;
  const pct = Number(lateFeeSettings?.percentOfRent) || 0;
  const price = Number(monthlyPrice) || 0;
  return flat + (pct / 100) * price;
}

function dueDateOf(unit) {
  return (
    unit?.paymentDate ??
    unit?.paymentInfo?.paymentDate ??
    unit?.lastMoveInDate ??
    null
  );
}

export function isUnitOverdue(unit, gracePeriodDays, now = new Date()) {
  const due = dueDateOf(unit);
  if (!due) return false;
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - gracePeriodDays);
  return new Date(due) < threshold;
}
