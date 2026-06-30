import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";

const router = Router();

router.get("/statistics", async (req, res): Promise<void> => {
  try {
    const allReports = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt)).limit(500);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent = allReports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
    const outages = allReports.filter(r => r.type === "outage");
    const resolved = outages.filter(r => r.status === "resolved" && r.resolvedAt);

    const durations = resolved.map(r => {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.resolvedAt!).getTime();
      return Math.max(0, (end - start) / (1000 * 60));
    });

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const longestOutage = durations.length > 0 ? Math.max(...durations) : 0;
    const monthlyOutages = recent.filter(r => r.type === "outage").length;

    const activeOutages = allReports.filter(r => r.type === "outage" && r.status === "active");
    const activeReports = allReports.filter(r => r.status === "active").length;

    let currentStatus: "available" | "outage" | "unstable" | "unknown" = "unknown";
    if (allReports.length === 0) {
      currentStatus = "unknown";
    } else if (activeOutages.length > 3) {
      currentStatus = "outage";
    } else if (activeOutages.length > 0) {
      currentStatus = "unstable";
    } else {
      currentStatus = "available";
    }

    const totalTime = 30 * 24 * 60;
    const totalDowntime = durations.reduce((a, b) => a + b, 0);
    const reliabilityPercent = Math.max(0, Math.min(100, ((totalTime - totalDowntime) / totalTime) * 100));

    res.json({
      reliabilityPercent: Math.round(reliabilityPercent * 10) / 10,
      avgOutageDurationMinutes: Math.round(avgDuration),
      monthlyOutages,
      longestOutageMinutes: Math.round(longestOutage),
      currentStatus,
      activeReports,
      totalReports: allReports.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get statistics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
