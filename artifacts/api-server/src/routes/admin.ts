import { Router } from "express";
import { db, reportsTable, usersTable } from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /admin/reports
router.get("/admin/reports", requireAuth, async (req, res): Promise<void> => {
  const { status, type, limit = "100", offset = "0" } = req.query as Record<string, string>;
  try {
    const conditions: any[] = [];
    if (status) conditions.push(eq(reportsTable.status, status));
    if (type) conditions.push(eq(reportsTable.type, type));

    const [reports, totalResult] = await Promise.all([
      db.select().from(reportsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(reportsTable.createdAt))
        .limit(Math.min(parseInt(limit) || 100, 500))
        .offset(parseInt(offset) || 0),
      db.select({ count: count() }).from(reportsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    res.json({ reports, total: totalResult[0]?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to list admin reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users
router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  const { limit = "100", offset = "0" } = req.query as Record<string, string>;
  try {
    const [users, totalResult] = await Promise.all([
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        reputation: usersTable.reputation,
        createdAt: usersTable.createdAt,
        reportCount: sql<number>`(SELECT COUNT(*)::int FROM reports WHERE reports.user_id = ${usersTable.id})`,
      }).from(usersTable)
        .orderBy(desc(usersTable.createdAt))
        .limit(Math.min(parseInt(limit) || 100, 500))
        .offset(parseInt(offset) || 0),
      db.select({ count: count() }).from(usersTable),
    ]);

    res.json({ users, total: totalResult[0]?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to list admin users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/statistics
router.get("/admin/statistics", requireAuth, async (req, res): Promise<void> => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const [
      totalRows,
      activeRows,
      resolvedRows,
      userRows,
      outageRows,
      restorationRows,
      transformerRows,
      verifiedRows,
      todayRows,
      weekRows,
    ] = await Promise.all([
      db.select({ count: count() }).from(reportsTable),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "active")),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "resolved")),
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.type, "outage")),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.type, "restoration")),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.type, "transformer")),
      db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.verified, true)),
      db.select({ count: count() }).from(reportsTable)
        .where(sql`${reportsTable.createdAt} >= ${startOfDay}`),
      db.select({ count: count() }).from(reportsTable)
        .where(sql`${reportsTable.createdAt} >= ${startOfWeek}`),
    ]);

    res.json({
      totalReports: totalRows[0]?.count ?? 0,
      activeReports: activeRows[0]?.count ?? 0,
      resolvedReports: resolvedRows[0]?.count ?? 0,
      totalUsers: userRows[0]?.count ?? 0,
      outageReports: outageRows[0]?.count ?? 0,
      restorationReports: restorationRows[0]?.count ?? 0,
      transformerReports: transformerRows[0]?.count ?? 0,
      verifiedReports: verifiedRows[0]?.count ?? 0,
      reportsToday: todayRows[0]?.count ?? 0,
      reportsThisWeek: weekRows[0]?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin statistics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
