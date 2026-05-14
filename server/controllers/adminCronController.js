const JOBS = {
  delinquency:      async () => (await import("../processes/delinquency.js")).updateTenantStatus,
  monthly:          async () => (await import("../processes/monthly.js")).updateTenantBalance,
  "orphan-cleanup": async () => (await import("../processes/orphanCleanup.js")).runOrphanCleanup,
};

export const runCronJob = async (req, res) => {
  const { job } = req.params;
  if (!(job in JOBS)) {
    return res.status(404).json({ error: "Unknown job" });
  }
  const start = Date.now();
  try {
    const fn = await JOBS[job]();
    const result = await fn({ disconnect: false });
    return res.status(200).json({ ok: true, job, durationMs: Date.now() - start, result });
  } catch (e) {
    console.error(`[cron] ${job} failed:`, e?.message || e);
    return res.status(500).json({ ok: false, job, error: e?.message || String(e), durationMs: Date.now() - start });
  }
};
